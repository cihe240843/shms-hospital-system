import uuid
from django.db import models
from django.contrib.auth.models import User
from apps.patients.models import Patient
from apps.common.fields import EncryptedTextField


class VitalObservation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="vitals")
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="recorded_vitals")
    chief_complaint = EncryptedTextField()
    allergy_notes = EncryptedTextField(blank=True)
    triage_notes = EncryptedTextField(blank=True)
    pain_score = models.PositiveSmallIntegerField(null=True, blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    bp_systolic = models.PositiveIntegerField()
    bp_diastolic = models.PositiveIntegerField()
    heart_rate = models.PositiveIntegerField()
    temperature = models.DecimalField(max_digits=4, decimal_places=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Vitals {self.patient_id} @ {self.created_at.isoformat()}"
