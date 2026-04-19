import uuid
from django.db import models
from django.contrib.auth.models import User
from apps.common.fields import EncryptedTextField

class Patient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fhir_id = EncryptedTextField(blank=True, null=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dob = models.DateField()
    medicare_number = EncryptedTextField(blank=True)
    phone = EncryptedTextField(blank=True)
    email = models.EmailField(blank=True)
    address = EncryptedTextField(blank=True)
    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patient_profile",
    )
    primary_doctor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="primary_patients",
    )
    invitation_token = models.CharField(max_length=255, blank=True)
    invitation_sent_at = models.DateTimeField(null=True, blank=True)
    invitation_expires_at = models.DateTimeField(null=True, blank=True)
    invitation_accepted_at = models.DateTimeField(null=True, blank=True)
    password_reset_token = models.CharField(max_length=255, blank=True)
    password_reset_sent_at = models.DateTimeField(null=True, blank=True)
    password_reset_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
