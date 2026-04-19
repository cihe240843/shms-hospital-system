import hashlib
from datetime import timedelta
from django.contrib.auth.models import Group, User
from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import AuditLog, LoginSecurityState, MFAChallenge
from .serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get"])
    def verify(self, request):
        logs = AuditLog.objects.order_by("id")
        prev = "0" * 64
        for log in logs:
            data = f"{log.user_id}{log.action}{log.resource}{log.resource_id}{log.ip_address}{prev}"
            expected = hashlib.sha256(data.encode()).hexdigest()
            if expected != log.row_hash:
                return Response({"status": "TAMPERED", "row_id": log.id})
            prev = log.row_hash
        return Response({"status": "PASS", "total_entries": logs.count()})


class SecurityAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        since = timezone.now() - timedelta(hours=24)
        recent_logs = AuditLog.objects.filter(timestamp__gte=since)
        recent_events = recent_logs.count()
        login_fails = recent_logs.filter(action="LOGIN_FAIL").count()
        login_locked = recent_logs.filter(action="LOGIN_LOCKED").count()
        login_success = recent_logs.filter(action="LOGIN_SUCCESS").count()
        mfa_fails = recent_logs.filter(action="LOGIN_MFA_FAIL").count()
        active_mfa = MFAChallenge.objects.filter(used_at__isnull=True, expires_at__gte=timezone.now()).count()

        suspicious_users = []
        fail_rows = (
            recent_logs.filter(action__in=["LOGIN_FAIL", "LOGIN_LOCKED", "LOGIN_MFA_FAIL"])
            .values("user_id", "user__username")
            .annotate(failures=Count("id"))
            .order_by("-failures", "user__username")
        )
        for row in fail_rows[:10]:
            suspicious_users.append(
                {
                    "username": row.get("user__username") or "system",
                    "failures": row["failures"],
                    "risk": "HIGH" if row["failures"] >= 5 else "MEDIUM" if row["failures"] >= 3 else "LOW",
                }
            )

        top_ips = (
            recent_logs.exclude(ip_address__isnull=True)
            .values("ip_address")
            .annotate(events=Count("id"))
            .order_by("-events", "ip_address")[:10]
        )

        locked_accounts = []
        for state in LoginSecurityState.objects.select_related("user").filter(locked_until__gt=timezone.now()).order_by("-locked_until"):
            locked_accounts.append(
                {
                    "username": state.user.username,
                    "locked_until": state.locked_until,
                    "failed_attempts": state.failed_attempts,
                }
            )

        status = "PASS" if login_fails == 0 and login_locked == 0 and len(locked_accounts) == 0 else "REVIEW"
        return Response(
            {
                "status": status,
                "window_hours": 24,
                "totals": {
                    "events": recent_events,
                    "login_success": login_success,
                    "login_fail": login_fails,
                    "login_locked": login_locked,
                    "mfa_fail": mfa_fails,
                    "active_mfa": active_mfa,
                    "locked_accounts": len(locked_accounts),
                },
                "suspicious_users": suspicious_users,
                "top_ips": list(top_ips),
                "locked_accounts_list": locked_accounts,
            }
        )


class UserManagementView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def infer_role(user):
        group = user.groups.first()
        if group:
            name = group.name.lower()
            if name in ["gp", "nurse", "admin", "superadmin", "patient"]:
                return name
        username = (user.username or "").lower()
        if username == "superadmin":
            return "superadmin"
        if username.startswith("admin"):
            return "admin"
        if username.startswith("nurse"):
            return "nurse"
        if hasattr(user, "patient_profile") and user.patient_profile is not None:
            return "patient"
        return "gp"

    @staticmethod
    def is_superadmin(user):
        return UserManagementView.infer_role(user) == "superadmin"

    @staticmethod
    def serialize_user(user):
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": UserManagementView.infer_role(user),
            "is_active": user.is_active,
        }

    def get(self, request):
        users = User.objects.filter(is_superuser=False).order_by("username")
        return Response([self.serialize_user(u) for u in users])

    def post(self, request):
        if not self.is_superadmin(request.user):
            return Response({"detail": "Only superadmin can create users."}, status=403)

        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        email = (request.data.get("email") or "").strip()
        first_name = (request.data.get("first_name") or "").strip()
        last_name = (request.data.get("last_name") or "").strip()
        role = (request.data.get("role") or "").strip().lower()

        if role not in ["gp", "nurse", "admin", "superadmin", "patient"]:
            return Response({"detail": "Invalid role."}, status=400)
        if not username or not password:
            return Response({"detail": "Username and password are required."}, status=400)
        if User.objects.filter(username=username).exists():
            return Response({"detail": "Username already exists."}, status=400)

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )

        group, _ = Group.objects.get_or_create(name=role)
        user.groups.clear()
        user.groups.add(group)

        return Response(self.serialize_user(user), status=201)


class UserManagementDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def can_manage(request_user):
        return UserManagementView.is_superadmin(request_user)

    def patch(self, request, user_id):
        if not self.can_manage(request.user):
            return Response({"detail": "Only superadmin can update users."}, status=403)

        try:
            user = User.objects.get(pk=user_id, is_superuser=False)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        if "email" in request.data:
            user.email = (request.data.get("email") or "").strip()
        if "first_name" in request.data:
            user.first_name = (request.data.get("first_name") or "").strip()
        if "last_name" in request.data:
            user.last_name = (request.data.get("last_name") or "").strip()
        if "is_active" in request.data:
            user.is_active = bool(request.data.get("is_active"))

        role = request.data.get("role")
        if role is not None:
            role = str(role).strip().lower()
            if role not in ["gp", "nurse", "admin", "superadmin", "patient"]:
                return Response({"detail": "Invalid role."}, status=400)
            group, _ = Group.objects.get_or_create(name=role)
            user.groups.clear()
            user.groups.add(group)

        password = request.data.get("password")
        if password:
            user.set_password(password)

        user.save()
        return Response(UserManagementView.serialize_user(user))


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        role = UserManagementView.infer_role(request.user)
        return Response(
            {
                "id": request.user.id,
                "username": request.user.username,
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
                "email": request.user.email,
                "role": role,
            }
        )


class DoctorListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        doctors = []
        for user in User.objects.filter(is_active=True).order_by("username"):
            if UserManagementView.infer_role(user) == "gp":
                doctors.append(
                    {
                        "id": user.id,
                        "username": user.username,
                        "display_name": user.get_full_name() or user.username,
                    }
                )
        return Response(doctors)
