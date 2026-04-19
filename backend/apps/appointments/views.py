from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from datetime import timezone as dt_timezone
from apps.patients.models import Patient
from .models import Appointment
from .serializers import AppointmentSerializer


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


def _normalize_aware_utc(value):
    if timezone.is_naive(value):
        value = timezone.make_aware(value, timezone.get_current_timezone())
    return value.astimezone(dt_timezone.utc)


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        role = infer_role(self.request.user)
        qs = Appointment.objects.select_related("patient", "doctor").all()
        if role == "gp":
            qs = qs.filter(doctor=self.request.user)
        elif role == "patient":
            qs = qs.filter(patient__user=self.request.user)
        return qs

    def perform_create(self, serializer):
        role = infer_role(self.request.user)
        doctor = serializer.validated_data.get("doctor")

        if role == "gp":
            if doctor and doctor != self.request.user:
                raise PermissionDenied("GP can only create appointments for themselves.")
            doctor = self.request.user
        elif role in ["admin", "superadmin"] and not doctor:
            raise ValidationError({"doctor": "Doctor selection is required."})

        appointment = serializer.save(doctor=doctor)
        if appointment.patient and appointment.doctor and not appointment.patient.primary_doctor:
            appointment.patient.primary_doctor = appointment.doctor
            appointment.patient.save(update_fields=["primary_doctor"])

    def perform_update(self, serializer):
        role = infer_role(self.request.user)
        doctor = serializer.validated_data.get("doctor")

        if role == "gp":
            if doctor and doctor != self.request.user:
                raise PermissionDenied("GP can only assign appointments to themselves.")
            doctor = self.request.user
        elif role in ["admin", "superadmin"] and not doctor:
            raise ValidationError({"doctor": "Doctor selection is required."})

        appointment = serializer.save(doctor=doctor)
        if appointment.patient and appointment.doctor and not appointment.patient.primary_doctor:
            appointment.patient.primary_doctor = appointment.doctor
            appointment.patient.save(update_fields=["primary_doctor"])

    @action(detail=False, methods=["post"], url_path="patient-request")
    def patient_request(self, request):
        role = infer_role(request.user)
        if role != "patient":
            raise PermissionDenied("Only patient accounts can request appointments.")

        patient = Patient.objects.filter(user=request.user).first()
        if not patient:
            raise ValidationError({"detail": "No patient profile linked to this account."})

        doctor_id = request.data.get("doctor_id")
        scheduled_at_raw = (request.data.get("scheduled_at") or "").strip()
        appointment_type = (request.data.get("appointment_type") or "GP Consult").strip() or "GP Consult"
        notes = (request.data.get("notes") or "").strip()

        if not scheduled_at_raw:
            raise ValidationError({"detail": "scheduled_at is required."})

        doctor = None
        if doctor_id:
            try:
                doctor = User.objects.get(pk=doctor_id, is_active=True)
            except (User.DoesNotExist, ValueError, TypeError):
                raise ValidationError({"doctor_id": "Selected doctor not found."})

        if not doctor:
            if patient.primary_doctor and patient.primary_doctor.is_active:
                doctor = patient.primary_doctor
            else:
                doctor = (
                    User.objects.filter(is_active=True, groups__name__iexact="gp")
                    .order_by("username")
                    .first()
                )

        if not doctor:
            raise ValidationError({"detail": "No active GP is available right now."})

        scheduled_at = parse_datetime(scheduled_at_raw)
        if scheduled_at is None:
            raise ValidationError({"scheduled_at": "Invalid datetime format."})
        scheduled_at = _normalize_aware_utc(scheduled_at)
        now_utc = _normalize_aware_utc(timezone.now())
        if scheduled_at <= now_utc:
            raise ValidationError({"scheduled_at": "Appointment time must be in the future."})

        appt = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            scheduled_at=scheduled_at,
            appointment_type=appointment_type,
            status="booked",
            notes=notes,
        )

        if not patient.primary_doctor:
            patient.primary_doctor = doctor
            patient.save(update_fields=["primary_doctor"])

        return Response(AppointmentSerializer(appt).data, status=201)

    @action(detail=True, methods=["post"], url_path="patient-reschedule")
    def patient_reschedule(self, request, pk=None):
        role = infer_role(request.user)
        if role != "patient":
            raise PermissionDenied("Only patient accounts can reschedule appointments.")

        appt = self.get_object()
        if not appt.patient or appt.patient.user_id != request.user.id:
            raise PermissionDenied("You can only reschedule your own appointments.")
        if appt.status != "booked":
            raise ValidationError({"detail": "Only booked appointments can be rescheduled."})

        scheduled_at_raw = (request.data.get("scheduled_at") or "").strip()
        reason = (request.data.get("reason") or "").strip()
        if not scheduled_at_raw:
            raise ValidationError({"scheduled_at": "New appointment time is required."})

        scheduled_at = parse_datetime(scheduled_at_raw)
        if scheduled_at is None:
            raise ValidationError({"scheduled_at": "Invalid datetime format."})
        scheduled_at = _normalize_aware_utc(scheduled_at)
        now_utc = _normalize_aware_utc(timezone.now())
        if scheduled_at <= now_utc:
            raise ValidationError({"scheduled_at": "Appointment time must be in the future."})

        appt.scheduled_at = scheduled_at
        if reason:
            appt.notes = f"{appt.notes}\nReschedule request: {reason}".strip()
        appt.save(update_fields=["scheduled_at", "notes"])

        return Response(AppointmentSerializer(appt).data)

    @action(detail=True, methods=["post"], url_path="patient-cancel")
    def patient_cancel(self, request, pk=None):
        role = infer_role(request.user)
        if role != "patient":
            raise PermissionDenied("Only patient accounts can cancel appointments.")

        appt = self.get_object()
        if not appt.patient or appt.patient.user_id != request.user.id:
            raise PermissionDenied("You can only cancel your own appointments.")
        if appt.status != "booked":
            raise ValidationError({"detail": "Only booked appointments can be cancelled."})

        reason = (request.data.get("reason") or "").strip()
        appt.status = "cancelled"
        if reason:
            appt.notes = f"{appt.notes}\nCancellation reason: {reason}".strip()
        appt.save(update_fields=["status", "notes"])

        return Response(AppointmentSerializer(appt).data)
