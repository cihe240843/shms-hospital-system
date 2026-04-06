from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class MeView(APIView):
    """
    Identify the currently authenticated user.
    Used by frontend to route Patient vs Staff dashboards.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Patient user
        if hasattr(user, "patientprofile"):
            return Response({
                "type": "PATIENT",
                "username": user.username,
                "patient_id": str(user.patientprofile.patient.id),
            })

        # Staff user (Admin / GP / Nurse)
        if hasattr(user, "profile"):
            return Response({
                "type": "STAFF",
                "role": user.profile.role,
                "username": user.username,
            })

        # Fallback (should not normally happen)
        return Response({
            "type": "UNKNOWN",
            "username": user.username,
        })


class GPListView(APIView):
    """
    Return all General Practitioners (GPs) for patient appointment booking.

    Supports flexible role values such as:
    - "GP"
    - "General Practitioner"
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        gps = (
            User.objects.filter(profile__role__iexact="GP")
            | User.objects.filter(profile__role__icontains="General")
        )

        gps = gps.distinct().values(
            "id",
            "first_name",
            "last_name",
            "username",
        )

        return Response(list(gps))
