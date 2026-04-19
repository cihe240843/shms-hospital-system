#!/usr/bin/env python
import os
import sys
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.audit.models import LoginSecurityState

# Create a test user if not exists
test_user, created = User.objects.get_or_create(
    username='teststaff',
    defaults={
        'email': 'teststaff@test.com',
        'first_name': 'Test',
        'last_name': 'Staff'
    }
)

if created:
    test_user.set_password('password123')
    test_user.save()
    print(f"Created test user: {test_user.username}")
else:
    print(f"Test user already exists: {test_user.username}")

# Lock this user
state, _ = LoginSecurityState.objects.get_or_create(user=test_user)
state.failed_attempts = 5
state.locked_until = timezone.now() + timedelta(hours=1)
state.save()

print(f"User ID: {test_user.id}")
print(f"Locked: {state.is_locked()}")
print(f"Failed attempts: {state.failed_attempts}")
print(f"Locked until: {state.locked_until}")
print(f"\nNow test with user_id={test_user.id}")
