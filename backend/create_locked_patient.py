#!/usr/bin/env python
import os
import sys
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User, Group
from apps.audit.models import LoginSecurityState
from apps.patients.models import Patient
import uuid

# Create a test patient user
patient_user, created = User.objects.get_or_create(
    username='testpatient',
    defaults={
        'email': 'testpatient@test.com',
        'first_name': 'Test',
        'last_name': 'Patient'
    }
)

if created:
    patient_user.set_password('password123')
    patient_user.save()
    print(f"Created test user: {patient_user.username}")
else:
    print(f"Test user already exists: {patient_user.username}")

# Add to patient group
group, _ = Group.objects.get_or_create(name='patient')
patient_user.groups.clear()
patient_user.groups.add(group)

# Create patient record
patient, created = Patient.objects.get_or_create(
    user=patient_user,
    defaults={
        'id': uuid.uuid4(),
        'first_name': 'Test',
        'last_name': 'Patient',
        'dob': '1990-01-01',
        'email': 'testpatient@test.com'
    }
)

if created:
    print(f"Created patient record for: {patient_user.username}")
else:
    print(f"Patient record already exists")

# Lock this user
state, _ = LoginSecurityState.objects.get_or_create(user=patient_user)
state.failed_attempts = 5
state.locked_until = timezone.now() + timedelta(hours=1)
state.save()

print(f"\nPatient Setup:")
print(f"User ID: {patient_user.id}")
print(f"Email: {patient_user.email}")
print(f"Is patient: {hasattr(patient_user, 'patient_profile') and patient_user.patient_profile is not None}")
print(f"Locked: {state.is_locked()}")
print(f"Failed attempts: {state.failed_attempts}")
print(f"\nTest with user_id={patient_user.id}")
