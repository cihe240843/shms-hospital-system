import hashlib
import secrets
from datetime import timedelta
from django.conf import settings
from django.contrib.auth.models import Group, User
from django.core.mail import send_mail
from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import AuditLog, LoginSecurityState, MFAChallenge, AccountUnlockToken
from .serializers import AuditLogSerializer


def _client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _audit_event(user, action, resource, resource_id, request=None):
    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            resource=resource,
            resource_id=resource_id,
            ip_address=_client_ip(request) if request else None,
        )
    except Exception:
        pass

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
                    "id": state.user.id,
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


class UnlockAccountRequestView(APIView):
    """
    Superadmin initiate account unlock.
    - Staff users: instant unlock
    - Patient users: send verification email
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def is_superadmin(user):
        return UserManagementView.infer_role(user) == "superadmin"

    @staticmethod
    def is_patient(user):
        return hasattr(user, "patient_profile") and user.patient_profile is not None

    def post(self, request):
        """Initiate unlock for a locked account."""
        if not self.is_superadmin(request.user):
            return Response({"detail": "Only superadmin can unlock accounts."}, status=403)

        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"detail": "user_id is required."}, status=400)

        try:
            target_user = User.objects.get(pk=user_id, is_superuser=False)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        state = LoginSecurityState.objects.filter(user=target_user).first()
        if not state or not state.is_locked():
            return Response({"detail": "Account is not locked."}, status=400)

        is_patient = self.is_patient(target_user)

        if is_patient:
            # Send verification email for patient
            token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(token.encode()).hexdigest()

            unlock_window_minutes = getattr(settings, "AUTH_UNLOCK_VERIFY_MINUTES", 30)

            unlock_token = AccountUnlockToken.objects.create(
                user=target_user,
                token_hash=token_hash,
                expires_at=timezone.now() + timedelta(minutes=unlock_window_minutes),
            )

            unlock_link = f"{getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173')}/unlock-account?token={token}&user={user_id}"

            send_mail(
                subject="Account Unlock Request",
                message=f"""Your account has been locked due to failed login attempts.

You can verify your identity to unlock your account by clicking the link below within {unlock_window_minutes} minutes:

{unlock_link}

If you did not request this, please ignore this email.
""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[target_user.email],
                fail_silently=False,
            )

            _audit_event(
                request.user,
                "UNLOCK_REQ_PATIENT",
                "auth",
                target_user.username,
                request,
            )

            return Response(
                {
                    "detail": "Verification email sent to patient.",
                    "message": "Patient must verify identity via email link.",
                    "expires_in_minutes": unlock_window_minutes,
                },
                status=200,
            )
        else:
            # Instant unlock for staff
            state.failed_attempts = 0
            state.locked_until = None
            state.save(update_fields=["failed_attempts", "locked_until", "updated_at"])

            _audit_event(
                request.user,
                "UNLOCK_DONE_STAFF",
                "auth",
                target_user.username,
                request,
            )

            return Response(
                {
                    "detail": f"Account {target_user.username} unlocked successfully.",
                    "user_id": target_user.id,
                },
                status=200,
            )


class VerifyUnlockTokenView(APIView):
    """
    Patient verifies unlock token from email to unlock their account.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        """Verify unlock token and unlock account."""
        token = (request.data.get("token") or "").strip()
        user_id = request.data.get("user_id")

        if not token or not user_id:
            return Response({"detail": "token and user_id are required."}, status=400)

        try:
            user = User.objects.get(pk=user_id, is_superuser=False)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        # Check if is patient
        if not (hasattr(user, "patient_profile") and user.patient_profile is not None):
            return Response({"detail": "Only patient accounts can self-verify unlock."}, status=403)

        token_hash = hashlib.sha256(token.encode()).hexdigest()

        from .models import AccountUnlockToken

        unlock_token = AccountUnlockToken.objects.filter(
            user=user,
            token_hash=token_hash,
            verified_at__isnull=True,
        ).first()

        if not unlock_token:
            return Response({"detail": "Invalid or already-used unlock token."}, status=401)

        if unlock_token.expires_at < timezone.now():
            return Response({"detail": "Unlock token has expired."}, status=401)

        # Mark token as verified
        unlock_token.verified_at = timezone.now()
        unlock_token.save(update_fields=["verified_at"])

        # Unlock the account
        state = LoginSecurityState.objects.filter(user=user).first()
        if state:
            state.failed_attempts = 0
            state.locked_until = None
            state.save(update_fields=["failed_attempts", "locked_until", "updated_at"])

        _audit_event(
            user,
            "UNLOCK_DONE_PATIENT",
            "auth",
            user.username,
            request,
        )

        return Response(
            {
                "detail": "Account unlocked successfully. You can now log in.",
                "user_id": user.id,
            },
            status=200,
        )
