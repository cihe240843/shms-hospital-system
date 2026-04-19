#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.audit.models import LoginSecurityState

user = User.objects.filter(username='dr.smith').first()
if user:
    state = LoginSecurityState.objects.filter(user=user).first()
    print(f'User: {user.username} (id={user.id})')
    print(f'Locked: {state.is_locked() if state else "No state"}')
    is_patient = hasattr(user, 'patient_profile') and user.patient_profile is not None
    print(f'Is patient: {is_patient}')
    print(f'Role: {"patient" if is_patient else "staff"}')
else:
    print('User dr.smith not found')
