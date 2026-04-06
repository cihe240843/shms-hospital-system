from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Patient
from .serializers import PatientSerializer
from audit.models import AuditLog

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        patient = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action="CREATE",
            resource="Patient",
            resource_id=str(patient.id),
        )

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        AuditLog.objects.create(
            user=request.user,
            action="READ",
            resource="Patient",
            resource_id=str(kwargs["pk"]),
        )
        return response

    def perform_update(self, serializer):
        patient = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action="UPDATE",
            resource="Patient",
            resource_id=str(patient.id),
        )

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            user=self.request.user,
            action="DELETE",
            resource="Patient",
            resource_id=str(instance.id),
        )
        instance.delete()