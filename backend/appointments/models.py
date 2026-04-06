from django.db import models

# Create your models here.
import uuid
from django.db import models
from django.contrib.auth.models import User
from patients.models import Patient


class Appointment(models.Model):
    STATUS_CHOICES = (
        ("BOOKED", "Booked"),
        ("RESCHEDULED", "Rescheduled"),
        ("CANCELLED", "Cancelled"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    gp = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="appointments"
    )
    appointment_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="BOOKED")
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient} with {self.gp} at {self.appointment_time}"