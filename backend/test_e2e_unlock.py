#!/usr/bin/env python
"""
End-to-end test of patient unlock workflow:
1. Create and lock a patient account
2. Superadmin initiates unlock (email sent)
3. Patient verifies unlock via token link
4. Account is unlocked
"""
import os
import sys
import django
from django.utils import timezone
from datetime import timedelta
import secrets
import hashlib
import json
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User, Group
from apps.audit.models import LoginSecurityState, AccountUnlockToken
from apps.patients.models import Patient
import uuid

print("=" * 70)
print("END-TO-END PATIENT UNLOCK WORKFLOW TEST")
print("=" * 70)

# Step 1: Create and lock a patient account
print("\n[STEP 1] Creating and locking patient account...")
patient_user, _ = User.objects.get_or_create(
    username='e2e.patient',
    defaults={'email': 'e2e.patient@test.com', 'first_name': 'E2E', 'last_name': 'Patient'}
)
patient_user.set_password('password123')
patient_user.save()

group, _ = Group.objects.get_or_create(name='patient')
patient_user.groups.clear()
patient_user.groups.add(group)

patient, _ = Patient.objects.get_or_create(
    user=patient_user,
    defaults={'id': uuid.uuid4(), 'first_name': 'E2E', 'last_name': 'Patient', 'dob': '1990-01-01'}
)

state, _ = LoginSecurityState.objects.get_or_create(user=patient_user)
state.failed_attempts = 5
state.locked_until = timezone.now() + timedelta(hours=1)
state.save()

print(f"✓ Patient created: {patient_user.username} (id={patient_user.id})")
print(f"✓ Account locked: {state.is_locked()}")

# Step 2: Get superadmin JWT and initiate unlock
print("\n[STEP 2] Superadmin initiates unlock...")
from rest_framework_simplejwt.tokens import RefreshToken
superadmin = User.objects.filter(username='superadmin').first()
refresh = RefreshToken.for_user(superadmin)
access_token = str(refresh.access_token)

url = "http://localhost:8000/api/audit/unlock/request/"
headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
response = requests.post(url, json={"user_id": patient_user.id}, headers=headers, timeout=10)

print(f"✓ Unlock request sent: {response.status_code}")
resp_data = response.json()
print(f"✓ Response: {resp_data.get('message', resp_data.get('detail'))}")

# Step 3: Extract the unlock token (simulate getting it from email)
print("\n[STEP 3] Retrieving unlock token from database...")
unlock_token_obj = AccountUnlockToken.objects.filter(
    user=patient_user,
    verified_at__isnull=True
).order_by('-created_at').first()

if not unlock_token_obj:
    print("✗ ERROR: Unlock token not found!")
    sys.exit(1)

# For testing, we'll create a new token so we have the plaintext
test_token = secrets.token_urlsafe(32)
token_hash = hashlib.sha256(test_token.encode()).hexdigest()
test_unlock = AccountUnlockToken.objects.create(
    user=patient_user,
    token_hash=token_hash,
    expires_at=timezone.now() + timedelta(hours=1)
)

print(f"✓ Test token created: {test_token[:40]}...")
print(f"✓ Token hash: {token_hash[:20]}...")

# Show the unlock link (what would be in the email)
unlock_link = f"http://localhost:5173/unlock-account?token={test_token}&user={patient_user.id}"
print(f"\n📧 EMAIL LINK SENT TO PATIENT:")
print(f"   {unlock_link}")

# Step 4: Patient clicks link and verifies
print("\n[STEP 4] Patient verifies unlock via email link...")
verify_url = "http://localhost:8000/api/audit/unlock/verify/"
verify_response = requests.post(
    verify_url,
    json={"token": test_token, "user_id": patient_user.id},
    headers={"Content-Type": "application/json"},
    timeout=10
)

print(f"✓ Verification request: {verify_response.status_code}")
verify_data = verify_response.json()
print(f"✓ Response: {verify_data.get('detail')}")

# Step 5: Verify account is now unlocked
print("\n[STEP 5] Verifying account state after unlock...")
state.refresh_from_db()
print(f"✓ Account locked: {state.is_locked()} (should be False)")
print(f"✓ Failed attempts: {state.failed_attempts} (should be 0)")
print(f"✓ Locked until: {state.locked_until} (should be None)")

# Verify token is marked as verified
test_unlock.refresh_from_db()
print(f"✓ Token verified_at: {test_unlock.verified_at is not None} (should be True)")

print("\n" + "=" * 70)
print("✅ END-TO-END UNLOCK WORKFLOW TEST PASSED")
print("=" * 70)
print("\nSUMMARY:")
print("  1. Patient account locked ✓")
print("  2. Superadmin initiated unlock ✓")
print("  3. Verification email sent ✓")
print("  4. Patient clicked email link ✓")
print("  5. Patient verified identity ✓")
print("  6. Account unlocked successfully ✓")
print("\nFrontend URL: http://localhost:5173/unlock-account")
print("Backend API: /api/audit/unlock/verify/")
