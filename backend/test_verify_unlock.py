#!/usr/bin/env python
import os
import sys
import django
import json
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.audit.models import AccountUnlockToken
from django.contrib.auth.models import User

# Get the unlock token for testpatient
patient_user = User.objects.filter(username='testpatient').first()
if not patient_user:
    print("Patient user not found")
    sys.exit(1)

unlock_token = AccountUnlockToken.objects.filter(user=patient_user, verified_at__isnull=True).first()
if not unlock_token:
    print("No unlock token found")
    sys.exit(1)

print(f"Patient: {patient_user.username} (id={patient_user.id})")
print(f"Unlock token found (hash: {unlock_token.token_hash[:20]}...)")

# Retrieve the plaintext token from database (we need to recreate it from a real token)
# Actually, we don't have the plaintext token stored. Let me create a new one for testing
import secrets
import hashlib
from django.utils import timezone
from datetime import timedelta

test_token = secrets.token_urlsafe(32)
token_hash = hashlib.sha256(test_token.encode()).hexdigest()

new_unlock = AccountUnlockToken.objects.create(
    user=patient_user,
    token_hash=token_hash,
    expires_at=timezone.now() + timedelta(hours=1)
)

print(f"\nCreated test token for verification: {test_token[:30]}...")

# Test verification endpoint
url = "http://localhost:8000/api/audit/unlock/verify/"
headers = {"Content-Type": "application/json"}
data = {
    "token": test_token,
    "user_id": patient_user.id
}

print(f"\nTesting verification at {url}...")
response = requests.post(url, json=data, headers=headers, timeout=10)
print(f"Status: {response.status_code}")
print(f"Response:")
try:
    resp_json = response.json()
    print(json.dumps(resp_json, indent=2))
except:
    print(response.text)

print("\n=== VERIFICATION ===")
# Check account is now unlocked
from apps.audit.models import LoginSecurityState
state = LoginSecurityState.objects.filter(user=patient_user).first()
if state:
    print(f"User: {patient_user.username}")
    print(f"Locked: {state.is_locked()} (should be False now)")
    print(f"Failed attempts: {state.failed_attempts} (should be 0)")
    print(f"Locked until: {state.locked_until} (should be None)")

# Check token is marked verified
verified_token = AccountUnlockToken.objects.filter(id=new_unlock.id).first()
if verified_token:
    print(f"\nToken verified_at: {verified_token.verified_at} (should not be None)")
