from django.db.models import Q
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from apps.common.fhir_client import sync_vitals, FHIRSyncError
from .models import VitalObservation
from .serializers import VitalObservationSerializer


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


class VitalObservationViewSet(viewsets.ModelViewSet):
    queryset = VitalObservation.objects.select_related("patient", "recorded_by").all()
    serializer_class = VitalObservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        role = infer_role(self.request.user)
        qs = self.queryset
        if role == "gp":
            qs = qs.filter(Q(patient__primary_doctor=self.request.user) | Q(patient__appointments__doctor=self.request.user)).distinct()
        elif role == "nurse":
            qs = qs.all()
        elif role == "patient":
            qs = qs.filter(patient__user=self.request.user)
        elif role == "admin":
            qs = qs.none()
        return qs

    def perform_create(self, serializer):
        role = infer_role(self.request.user)
        if role not in ["nurse", "superadmin"]:
            raise PermissionDenied("Only nurse or superadmin can record vitals.")
        vital = serializer.save(recorded_by=self.request.user)
        try:
            sync_vitals(vital)
        except FHIRSyncError:
            # Keep local vitals workflow available even if HAPI is temporarily unavailable.
            pass

    def perform_update(self, serializer):
        role = infer_role(self.request.user)
        if role not in ["nurse", "superadmin"]:
            raise PermissionDenied("Only nurse or superadmin can update vitals.")
        vital = serializer.save()
        try:
            sync_vitals(vital)
        except FHIRSyncError:
            # Keep local vitals workflow available even if HAPI is temporarily unavailable.
            pass
