from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import MedicalReport
from .serializers import MedicalReportSerializer


class MedicalReportViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Patient → only their reports
        if hasattr(user, "patientprofile"):
            return MedicalReport.objects.filter(
                patient=user.patientprofile.patient
            )

        # GP/Nurse/Admin → all (read-only enforced by permissions)
        return MedicalReport.objects.all()

    def perform_create(self, serializer):
        user = self.request.user

        # Only GP can create reports
        if not hasattr(user, "profile") or user.profile.role != "GP":
            raise PermissionDenied("Only GPs can create medical reports.")

        serializer.save(created_by=user)