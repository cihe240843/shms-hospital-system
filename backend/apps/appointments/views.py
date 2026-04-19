from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError
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
