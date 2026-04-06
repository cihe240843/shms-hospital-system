from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Patient, PatientProfile


@receiver(post_save, sender=Patient)
def create_patient_user(sender, instance, created, **kwargs):
    """
    Automatically create a login account for the patient.
    Username = patient email
    Default password = patient123 (can be reset later)
    """
    if created:
        user = User.objects.create_user(
            username=instance.email,
            email=instance.email,
            password="patient123"
        )
        PatientProfile.objects.create(
            user=user,
            patient=instance
        )