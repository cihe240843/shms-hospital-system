from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from .models import Patient
from .serializers import PatientSerializer
from audit.models import AuditLog


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    # -----------------------------
    # Role-Based Access Control
    # -----------------------------
    def has_role(self, request, roles):
        if not hasattr(request.user, "userprofile"):
            return False
        return request.user.profile.role in roles

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:  # GET, HEAD, OPTIONS
            # Admin, GP, Nurse can READ
            if self.has_role(self.request, ["ADMIN", "GP", "NURSE"]):
                return [IsAuthenticated()]
        else:
            # POST / PUT / PATCH
            if self.has_role(self.request, ["ADMIN", "GP"]):
                return [IsAuthenticated()]

        # DELETE only Admin
        if self.request.method == "DELETE":
            if self.has_role(self.request, ["ADMIN"]):
                return [IsAuthenticated()]

        # Deny everything else
        from rest_framework.permissions import IsAdminUser
        return [IsAdminUser()]

    # -----------------------------
    # Audit Logging
    # -----------------------------
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
