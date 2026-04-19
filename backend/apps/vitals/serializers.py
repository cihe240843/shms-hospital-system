from rest_framework import serializers
from .models import VitalObservation


class VitalObservationSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField(read_only=True)
    recorded_by_name = serializers.SerializerMethodField(read_only=True)

    def validate_pain_score(self, value):
        if value is None:
            return value
        if value < 0 or value > 10:
            raise serializers.ValidationError("Pain score must be between 0 and 10.")
        return value

    def validate(self, attrs):
        for field in ["height_cm", "weight_kg"]:
            value = attrs.get(field)
            if value is not None and value <= 0:
                raise serializers.ValidationError({field: "Must be greater than zero."})

        temp = attrs.get("temperature")
        if temp is not None and (temp < 30 or temp > 45):
            raise serializers.ValidationError({"temperature": "Temperature must be between 30 and 45 °C."})

        systolic = attrs.get("bp_systolic")
        diastolic = attrs.get("bp_diastolic")
        if systolic is not None and (systolic < 40 or systolic > 260):
            raise serializers.ValidationError({"bp_systolic": "Systolic BP is out of range."})
        if diastolic is not None and (diastolic < 20 or diastolic > 180):
            raise serializers.ValidationError({"bp_diastolic": "Diastolic BP is out of range."})

        heart_rate = attrs.get("heart_rate")
        if heart_rate is not None and (heart_rate < 20 or heart_rate > 240):
            raise serializers.ValidationError({"heart_rate": "Heart rate is out of range."})

        return attrs

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}" if obj.patient else ""

    def get_recorded_by_name(self, obj):
        return obj.recorded_by.get_full_name() or obj.recorded_by.username if obj.recorded_by else ""

    class Meta:
        model = VitalObservation
        fields = "__all__"
        read_only_fields = ["id", "recorded_by", "created_at", "patient_name", "recorded_by_name"]
