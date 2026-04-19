from rest_framework import serializers
from .models import Appointment

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}" if obj.patient else ""

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name() or obj.doctor.username if obj.doctor else ""

    class Meta:
        model = Appointment
        fields = "__all__"
