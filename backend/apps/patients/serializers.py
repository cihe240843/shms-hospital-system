from rest_framework import serializers
from .models import Patient

class PatientSerializer(serializers.ModelSerializer):
    primary_doctor_name = serializers.SerializerMethodField()

    def get_primary_doctor_name(self, obj):
        if not obj.primary_doctor:
            return ""
        return obj.primary_doctor.get_full_name() or obj.primary_doctor.username

    class Meta:
        model = Patient
        fields = "__all__"
        extra_kwargs = {
            "invitation_token": {"write_only": True},
            "password_reset_token": {"write_only": True},
        }
