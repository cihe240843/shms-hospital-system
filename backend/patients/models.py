import uuid
from django.db import models
from django.contrib.auth.models import User


class Patient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class PatientProfile(models.Model):
    """
    Links a Django User account to a Patient record.
    Used for Patient Portal login.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE)

    def __str__(self):
        return f"PatientUser: {self.user.username}"