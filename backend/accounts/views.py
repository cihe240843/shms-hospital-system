from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if hasattr(user, "patientprofile"):
            return Response({
                "type": "PATIENT",
                "patient_id": str(user.patientprofile.patient.id),
                "username": user.username,
            })

        if hasattr(user, "profile"):
            return Response({
                "type": "STAFF",
                "role": user.profile.role,
                "username": user.username,
            })

        return Response({
            "type": "UNKNOWN",
            "username": user.username,
        })