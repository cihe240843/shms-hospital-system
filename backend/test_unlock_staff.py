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

# Get superadmin
superadmin = User.objects.filter(username='superadmin').first()
if not superadmin:
    print("Superadmin user not found")
    sys.exit(1)

# Create JWT token
refresh = RefreshToken.for_user(superadmin)
access_token = str(refresh.access_token)

print(f"Superadmin: {superadmin.username}")
print(f"Testing unlock for teststaff (id=10)...\n")

# Test unlock endpoint
url = "http://localhost:8000/api/audit/unlock/request/"
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}
data = {"user_id": 10}

response = requests.post(url, json=data, headers=headers, timeout=10)
print(f"Status: {response.status_code}")
print(f"Response:")
try:
    print(json.dumps(response.json(), indent=2))
except:
    print(response.text)

print("\n=== VERIFICATION ===")
# Verify unlock
from apps.audit.models import LoginSecurityState
test_user = User.objects.filter(id=10).first()
if test_user:
    state = LoginSecurityState.objects.filter(user=test_user).first()
    if state:
        print(f"User: {test_user.username}")
        print(f"Locked: {state.is_locked()}")
        print(f"Failed attempts: {state.failed_attempts}")
        print(f"Locked until: {state.locked_until}")
