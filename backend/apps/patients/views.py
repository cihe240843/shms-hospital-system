import secrets
import hashlib
from datetime import timedelta
from django.conf import settings
from django.contrib.auth.models import Group, User
from django.core.mail import send_mail
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Patient
from .serializers import PatientSerializer


def infer_role(user):
    group = user.groups.first()
    if group:
        role = group.name.lower()
        if role in ["gp", "nurse", "admin", "superadmin", "patient"]:
            return role
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


def hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = infer_role(user)

        qs = Patient.objects.select_related("primary_doctor").all()
        if role == "gp":
            qs = qs.filter(Q(primary_doctor=user) | Q(appointments__doctor=user)).distinct()
        elif role == "patient":
            qs = qs.filter(user=user)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(Q(first_name__icontains=search) | Q(last_name__icontains=search))
        return qs

    def perform_create(self, serializer):
        role = infer_role(self.request.user)
        if role == "gp" and not serializer.validated_data.get("primary_doctor"):
            serializer.save(primary_doctor=self.request.user)
            return
        serializer.save()

    @action(detail=True, methods=["post"], url_path="send-invite")
    def send_invite(self, request, pk=None):
        role = infer_role(request.user)
        if role not in ["admin", "superadmin"]:
            raise PermissionDenied("Only admin or superadmin can send patient invites.")

        patient = self.get_object()
        if not patient.email:
            raise ValidationError({"email": "Patient email is required to send invite."})

        token = secrets.token_urlsafe(24)
        token_hash = hash_token(token)
        now = timezone.now()
        patient.invitation_token = token_hash
        patient.invitation_sent_at = now
        patient.invitation_expires_at = now + timedelta(hours=48)
        patient.save(update_fields=["invitation_token", "invitation_sent_at", "invitation_expires_at"])

        invite_link = f"{settings.FRONTEND_URL}/activate?token={token}"
        send_mail(
            subject="Activate your SHMS patient account",
            message=(
                f"Hello {patient.first_name},\n\n"
                "Your patient account invitation is ready.\n"
                f"Activate here: {invite_link}\n\n"
                "This link expires in 48 hours."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[patient.email],
            fail_silently=True,
        )

        return Response({"status": "sent", "expires_at": patient.invitation_expires_at})

    @action(
        detail=False,
        methods=["post"],
        url_path="activate",
        permission_classes=[AllowAny],
        authentication_classes=[],
    )
    def activate(self, request):
        token = (request.data.get("token") or "").strip()
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""

        if not token or not username or not password:
            raise ValidationError({"detail": "Token, username and password are required."})

        patient = Patient.objects.filter(invitation_token=hash_token(token)).first()
        if not patient:
            raise ValidationError({"detail": "Invalid invitation token."})
        if patient.invitation_expires_at and patient.invitation_expires_at < timezone.now():
            raise ValidationError({"detail": "Invitation token has expired."})
        if patient.user_id:
            raise ValidationError({"detail": "Patient account is already activated."})
        if User.objects.filter(username=username).exists():
            raise ValidationError({"detail": "Username already exists."})

        user = User.objects.create_user(
            username=username,
            password=password,
            email=patient.email,
            first_name=patient.first_name,
            last_name=patient.last_name,
        )
        group, _ = Group.objects.get_or_create(name="patient")
        user.groups.add(group)

        patient.user = user
        patient.invitation_accepted_at = timezone.now()
        patient.invitation_token = ""
        patient.save(update_fields=["user", "invitation_accepted_at", "invitation_token"])

        return Response({"status": "activated", "username": user.username})

    @action(
        detail=False,
        methods=["post"],
        url_path="request-password-reset",
        permission_classes=[AllowAny],
        authentication_classes=[],
    )
    def request_password_reset(self, request):
        identifier = (request.data.get("identifier") or "").strip()
        if not identifier:
            raise ValidationError({"detail": "Username or email is required."})

        patient = Patient.objects.filter(Q(user__username=identifier) | Q(email__iexact=identifier)).select_related("user").first()
        if not patient or not patient.user_id:
            return Response({"status": "ok"})

        token = secrets.token_urlsafe(24)
        token_hash = hash_token(token)
        now = timezone.now()
        patient.password_reset_token = token_hash
        patient.password_reset_sent_at = now
        patient.password_reset_expires_at = now + timedelta(hours=2)
        patient.save(update_fields=["password_reset_token", "password_reset_sent_at", "password_reset_expires_at"])

        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_mail(
            subject="Reset your SHMS patient password",
            message=(
                f"Hello {patient.first_name},\n\n"
                "You requested a password reset for your patient account.\n"
                f"Reset here: {reset_link}\n\n"
                "This link expires in 2 hours."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[patient.email] if patient.email else [],
            fail_silently=True,
        )

        return Response({"status": "ok"})

    @action(
        detail=False,
        methods=["post"],
        url_path="reset-password",
        permission_classes=[AllowAny],
        authentication_classes=[],
    )
    def reset_password(self, request):
        token = (request.data.get("token") or "").strip()
        password = request.data.get("password") or ""

        if not token or not password:
            raise ValidationError({"detail": "Token and new password are required."})

        patient = Patient.objects.filter(password_reset_token=hash_token(token)).select_related("user").first()
        if not patient:
            raise ValidationError({"detail": "Invalid reset token."})
        if patient.password_reset_expires_at and patient.password_reset_expires_at < timezone.now():
            raise ValidationError({"detail": "Reset token has expired."})
        if not patient.user_id:
            raise ValidationError({"detail": "Patient account is not activated yet."})

        patient.user.set_password(password)
        patient.user.save(update_fields=["password"])

        patient.password_reset_token = ""
        patient.password_reset_sent_at = timezone.now()
        patient.save(update_fields=["password_reset_token", "password_reset_sent_at"])

        return Response({"status": "password_reset"})

    @action(detail=False, methods=["get"], url_path="my-portal")
    def my_portal(self, request):
        role = infer_role(request.user)
        if role != "patient":
            raise PermissionDenied("Patient portal is only available to patient accounts.")

        patient = Patient.objects.filter(user=request.user).first()
        if not patient:
            raise ValidationError({"detail": "No patient profile linked to this account."})

        from apps.appointments.models import Appointment
        from apps.billing.models import Invoice

        appointments = Appointment.objects.filter(patient=patient).select_related("doctor").order_by("-scheduled_at")[:20]
        invoices = Invoice.objects.filter(patient=patient).order_by("-issued_at")[:20]

        return Response(
            {
                "patient": PatientSerializer(patient).data,
                "appointments": [
                    {
                        "id": str(a.id),
                        "scheduled_at": a.scheduled_at,
                        "doctor_name": a.doctor.get_full_name() or a.doctor.username if a.doctor else "",
                        "appointment_type": a.appointment_type,
                        "status": a.status,
                        "notes": a.notes,
                    }
                    for a in appointments
                ],
                "invoices": [
                    {
                        "id": str(i.id),
                        "description": i.description,
                        "amount": i.amount,
                        "status": i.status,
                        "issued_at": i.issued_at,
                        "paid_at": i.paid_at,
                    }
                    for i in invoices
                ],
            }
        )
