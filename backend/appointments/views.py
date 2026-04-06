from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404

from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Patient → only their appointments
        if hasattr(user, "patientprofile"):
            return Appointment.objects.filter(
                patient=user.patientprofile.patient
            )

        # GP → appointments assigned to them
        if hasattr(user, "profile") and user.profile.role.upper() == "GP":
            return Appointment.objects.filter(gp=user)

        # Admin / Nurse / Super Admin → all
        return Appointment.objects.all()

    def perform_create(self, serializer):
        user = self.request.user

        if not hasattr(user, "patientprofile"):
            raise PermissionDenied("Only patients can book appointments.")

        serializer.save(patient=user.patientprofile.patient)


def reschedule_appointment(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    user = request.user

    if not hasattr(user, "patientprofile"):
        raise PermissionDenied("Only patients can reschedule appointments.")

    if appointment.patient != user.patientprofile.patient:
        raise PermissionDenied("You can only reschedule your own appointment.")

    new_time = request.data.get("appointment_time")
    if not new_time:
        return Response(
            {"detail": "appointment_time is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    appointment.appointment_time = new_time
    appointment.status = "RESCHEDULED"
    appointment.save()

    return Response(AppointmentSerializer(appointment).data)


def cancel_appointment(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    user = request.user

    if not hasattr(user, "patientprofile"):
        raise PermissionDenied("Only patients can cancel appointments.")

    if appointment.patient != user.patientprofile.patient:
        raise PermissionDenied("You can only cancel your own appointment.")

    appointment.status = "CANCELLED"
    appointment.save()

    return Response(AppointmentSerializer(appointment).data)