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
4. Patient receives email and clicks verification link
5. Patient sees `/unlock-account` page, clicks "Unlock My Account"
6. Account is unlocked after verification
7. Patient redirected to login page

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
- **No plaintext tokens**: Only token hashes stored (SHA256)
- **Protected endpoint**: Patient verification endpoint rate-limited by Django

---

## Testing

All workflows are tested and verified:

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

### 1. AdminPanel Security Tab - Locked Accounts
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

### 2. Patient Unlock Verification Page (`UnlockAccount.jsx`)
**Route**: `/unlock-account?token=<token>&user=<user_id>`

**Features**:
- Extracts `token` and `user` from URL query parameters
- Shows account unlock information and verification form
- One-click "🔓 Unlock My Account" button
- Calls `/api/audit/unlock/verify/` endpoint
- Shows loading state during verification ("🔄 Verifying...")
- Displays success or error messages
- Auto-redirects to `/login` on success (2-second delay)
- Shows helpful message about contacting support if account lost/stolen

**Page Layout** (inherits Login.css styling):
```
┌─────────────────────────────────────────┐
│          🔓 Unlock Account              │
│  Verify your identity to regain access  │
│                                         │
│  Your account has been temporarily      │
│  locked due to multiple failed login    │
│  attempts.                              │
│                                         │
│  Click the button below to verify and   │
│  unlock your account.                   │
│                                         │
│  [  🔓 UNLOCK MY ACCOUNT  ]   [loading]│
│                                         │
│  Didn't request this? Your account      │
│  is still locked and can only be        │
│  unlocked by our support team.          │
│  [Back to Login]                        │
└─────────────────────────────────────────┘
```

**Complete User Flow**:
1. Patient receives email: "Account Unlock Request"
2. Email contains link: `http://localhost:5173/unlock-account?token=abc123...&user=12`
3. Patient clicks link → React router loads `/unlock-account` page
4. `UnlockAccount.jsx` extracts token and user from URL
5. Page displays unlock verification form
6. Patient clicks "🔓 Unlock My Account" button
7. Frontend POST to `/api/audit/unlock/verify/` with token + user_id
8. Backend verifies:
   - Token exists and not already used
   - Token not expired (< 30 min)
   - User matches token owner
   - Hash matches stored hash
9. Backend unlocks account and marks token verified_at
10. Frontend shows "Account unlocked successfully"
11. Page redirects to `/login` after 2 seconds
12. Patient can now log in with username/password

---

## Email Template (Patient Unlock)
```
Subject: Account Unlock Request

Your account has been locked due to failed login attempts.

You can verify your identity to unlock your account by clicking the link below within 30 minutes:

https://localhost:5173/unlock-account?token=VhLlMVTjXR8EFcTZ15D1TKRrpT6...&user=12

If you did not request this, please ignore this email and contact support.
```

---

## Code Files

### Backend
- `backend/apps/audit/models.py` - `AccountUnlockToken` model
- `backend/apps/audit/views.py` - `UnlockAccountRequestView`, `VerifyUnlockTokenView`
- `backend/apps/audit/urls.py` - Routes `/unlock/request/` and `/unlock/verify/`
- `backend/apps/audit/migrations/0003_accountunlocktoken.py` - Schema migration

### Frontend
- `frontend/src/pages/UnlockAccount.jsx` - Patient verification page component
- `frontend/src/App.jsx` - Route `/unlock-account`
- `frontend/src/pages/AdminPanel.jsx` - Unlock button in Security tab

### Tests
- `backend/test_e2e_unlock.py` - End-to-end workflow test

---

## Future Enhancements
1. Add audit log entry for unlock actions (who unlocked, when, result)
2. Add resend unlock email button if token expires
3. Add SMS as alternative to email for patients
4. Add cooldown before next unlock attempt for same account
5. Add HSM key storage for token hashing in production
6. Add unlock history dashboard showing all unlock events
7. Add webhook notifications to security team for patient unlocks
