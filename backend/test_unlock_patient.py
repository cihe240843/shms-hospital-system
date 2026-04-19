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
from apps.audit.models import AccountUnlockToken

# Get superadmin
superadmin = User.objects.filter(username='superadmin').first()
if not superadmin:
    print("Superadmin user not found")
    sys.exit(1)

# Create JWT token
refresh = RefreshToken.for_user(superadmin)
access_token = str(refresh.access_token)

print(f"Superadmin: {superadmin.username}")
print(f"Testing unlock for testpatient (id=11, PATIENT)...\n")

# Test unlock endpoint
url = "http://localhost:8000/api/audit/unlock/request/"
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}
data = {"user_id": 11}

response = requests.post(url, json=data, headers=headers, timeout=10)
print(f"Status: {response.status_code}")
print(f"Response:")
try:
    resp_json = response.json()
    print(json.dumps(resp_json, indent=2))
except:
    print(response.text)

print("\n=== VERIFICATION ===")
# Verify account is STILL locked (for patient, email is sent, not instant unlock)
patient_user = User.objects.filter(id=11).first()
if patient_user:
    from apps.audit.models import LoginSecurityState
    state = LoginSecurityState.objects.filter(user=patient_user).first()
    if state:
        print(f"User: {patient_user.username}")
        print(f"Locked: {state.is_locked()} (should still be True - patient waits for email verification)")
        print(f"Failed attempts: {state.failed_attempts}")
    
    # Check if unlock token was created
    unlocks = AccountUnlockToken.objects.filter(user=patient_user)
    print(f"\nUnlock tokens created: {unlocks.count()}")
    for token in unlocks:
        print(f"  - Token: {token.token_hash[:20]}...")
        print(f"    Verified: {token.verified_at is not None}")
        print(f"    Expires: {token.expires_at}")
