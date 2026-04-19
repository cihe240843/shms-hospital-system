#!/usr/bin/env python
import os
import sys
import django
import json
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

# Get superadmin
superadmin = User.objects.filter(username='superadmin').first()
if not superadmin:
    print("Superadmin user not found")
    sys.exit(1)

# Create JWT token
refresh = RefreshToken.for_user(superadmin)
access_token = str(refresh.access_token)

print(f"Superadmin: {superadmin.username} (id={superadmin.id})")
print(f"Access token: {access_token[:30]}...")

# Test unlock endpoint
url = "http://localhost:8000/api/audit/unlock/request/"
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}
data = {"user_id": 1}  # dr.smith

print(f"\nTesting unlock for dr.smith (id=1)...")
response = requests.post(url, json=data, headers=headers, timeout=10)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Verify unlock
from apps.audit.models import LoginSecurityState
state = LoginSecurityState.objects.filter(user_id=1).first()
if state:
    print(f"\nAfter unlock:")
    print(f"Locked: {state.is_locked()}")
    print(f"Failed attempts: {state.failed_attempts}")
    print(f"Locked until: {state.locked_until}")
