import uuid
from django.db import models
from django.contrib.auth.models import User
from apps.patients.models import Patient

class Appointment(models.Model):
    STATUS_CHOICES = [("booked","Booked"),("done","Done"),("cancelled","Cancelled")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
    doctor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="appointments")
    scheduled_at = models.DateTimeField()
    appointment_type = models.CharField(max_length=100, default="GP Consult")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="booked")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["scheduled_at"]

    def __str__(self):
        return f"{self.patient} - {self.scheduled_at}"
