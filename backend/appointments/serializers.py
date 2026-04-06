from rest_framework import serializers
from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    doctor_role = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "appointment_time",
            "status",
            "doctor_name",
            "doctor_role",
        ]

    def get_doctor_name(self, obj):
        if obj.gp:
            return f"Dr. {obj.gp.first_name} {obj.gp.last_name}".strip()
        return "Not Assigned"

    def get_doctor_role(self, obj):
        if hasattr(obj.gp, "profile"):
            return obj.gp.profile.role
        return ""
