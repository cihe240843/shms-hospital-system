# Account Unlock Feature - Implementation Guide

## Overview
Differentiated account unlock workflow based on user type:
- **Staff Users** (GP, Nurse, Admin): Superadmin can unlock instantly
- **Patient Users**: Unlock via email verification link

## How It Works

### For Staff Users
1. Superadmin opens Admin Panel → Security tab → Locked Accounts section
2. Clicks **🔓 Unlock** button next to the locked staff account
3. Account is immediately unlocked (no email delay)
4. Failed attempts reset to 0
5. Success message: "Account [username] unlocked successfully."

### For Patient Users
1. Superadmin clicks **🔓 Unlock** next to locked patient account
2. System generates verification token
3. Email sent to patient with unlock link (30-min expiry)
4. Patient clicks link in email and verifies identity
5. Account is unlocked after verification
6. Success message: "Verification email sent to patient. They must verify to unlock."

---

## API Endpoints

### 1. Initiate Unlock
**POST** `/api/audit/unlock/request/`
- **Authentication**: Required (superadmin only)
- **Payload**: `{ "user_id": <int> }`
- **Response (Staff)**:
  ```json
  {
    "detail": "Account [username] unlocked successfully.",
    "user_id": 1
  }
  ```
- **Response (Patient)**:
  ```json
  {
    "detail": "Verification email sent to patient.",
    "message": "Patient must verify identity via email link.",
    "expires_in_minutes": 30
  }
  ```

### 2. Verify Patient Unlock Token
**POST** `/api/audit/unlock/verify/`
- **Authentication**: None (public - patient uses token from email)
- **Payload**: `{ "token": "<token_from_email>", "user_id": <int> }`
- **Response**:
  ```json
  {
    "detail": "Account unlocked successfully. You can now log in.",
    "user_id": 11
  }
  ```

---

## Database Models

### AccountUnlockToken
```python
user (FK to User)           # Patient who requested unlock
token_hash (str)            # SHA256 hash of unlock token (one-time use)
created_at (datetime)       # When token was created
expires_at (datetime)       # 30-min default expiry
verified_at (datetime)      # When patient verified (if used)
```

---

## Configuration (settings.py)
```python
AUTH_UNLOCK_VERIFY_MINUTES = 30  # Token expiry window for patients
FRONTEND_BASE_URL = "http://localhost:5173"  # For unlock links in emails
```

---

## Security Features
- **Instant unlock for staff**: Trust relationship (superadmin ↔ staff)
- **Email verification for patients**: Ownership verification (email access proof)
- **One-time tokens**: Each unlock token can only be used once (verified_at tracking)
- **Token expiry**: 30-minute default window
- **Role-based access**: Only superadmin can initiate unlocks
- **User type detection**: Automatically differentiates staff vs. patient on unlock

---

## Testing

All three workflows are tested and verified:

### 1. Staff Unlock (Instant)
```
Status: 200
✓ Account immediately unlocked
✓ Failed attempts → 0
✓ Locked until → NULL
```

### 2. Patient Email Verification  
```
Status: 200
✓ Email "sent" to patient
✓ Account remains locked
✓ Unlock token created (unverified)
✓ Token expires in 30 minutes
```

### 3. Patient Token Verification
```
Status: 200
✓ Account unlocked after token verification
✓ Failed attempts → 0
✓ Token marked as verified
```

---

## Frontend Implementation

### AdminPanel Security Tab - Locked Accounts
Each locked account shows:
- Username
- Locked until timestamp
- Failed attempts badge
- 🔓 Unlock button

Button behavior:
- Superadmin clicks → API called with user_id
- For staff: instant unlock, shows "Account unlocked successfully"
- For patient: sends email, shows "Verification email sent..."
- Security tab refreshes to remove unlocked account from list

---

## Email Template (Patient Unlock)
```
Subject: Account Unlock Request

Your account has been locked due to failed login attempts.

You can verify your identity to unlock your account by clicking the link below within 30 minutes:

[unlock link with token]

If you did not request this, please ignore this email.
```

---

## Future Enhancements
1. Add patient-facing unlock verification page: `/unlock-account?token=...&user=...`
2. Add resend unlock email button if token expires
3. Add audit log entry for unlock actions
4. Add HSM key storage for token hashing in production
5. Add SMS as alternative to email for patients
6. Add cooldown before next unlock attempt for same account
