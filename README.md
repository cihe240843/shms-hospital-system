# SHMS — Secure Hospital Management System
### ICT946 Capstone Project · Crown Institute of Higher Education · Master of IT

---

## Quick Start (3 commands)

```bash
# 1. Clone and enter
cd shms-full

# 2. Start all 6 backend services
docker-compose up -d

# 3. Start the React frontend
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Login Credentials

| Role       | Username       | Password    |
|------------|----------------|-------------|
| GP         | dr.smith       | password123 |
| Nurse      | nurse.jones    | password123 |
| Admin      | admin.lee      | password123 |
| Superadmin | superadmin     | password123 |

---

## Architecture

```
Browser (React/Vite :5173)
    ↓ Axios + JWT
Django REST API (:8000)
    ├── PostgreSQL (:5432)   — Patient, Invoice, Inventory, Audit data
    ├── Keycloak   (:8080)   — Authentication & JWT tokens
    ├── OPA        (:8181)   — Policy engine (RBAC)
    ├── HAPI FHIR  (:8090)   — Clinical data (Observations)
    └── MinIO      (:9001)   — Backup object storage (WORM)
```

---

## Pages & Role Access

| Page         | GP | Nurse | Admin | Superadmin |
|--------------|----|-------|-------|------------|
| Dashboard    | ✓  | ✓     | ✓     | ✓          |
| Patients     | ✓  | ✓ (read) | —  | ✓          |
| Appointments | ✓  | ✓     | —     | ✓          |
| Vitals       | —  | ✓     | —     | ✓          |
| Billing      | —  | —     | ✓     | ✓          |
| Inventory    | —  | —     | ✓     | ✓          |
| Admin Panel  | —  | —     | —     | ✓          |

---

## Verify Services Are Running

```bash
docker-compose ps
# Should show 6 services: db, keycloak, opa, hapi, minio, backend

# Test OPA policy
curl -X POST http://localhost:8181/v1/data/shms/authz/allow \
  -H "Content-Type: application/json" \
  -d '{"input": {"role": "nurse", "resource": "billing", "action": "write"}}'
# Expected: {"result": false}

# Check HAPI FHIR
open http://localhost:8090/fhir/metadata

# Check MinIO
open http://localhost:9001
# Login: minioadmin / minioadmin123
```

---

## Run Backup & Restore

```bash
# Backup database to MinIO
python scripts/backup.py

# Restore from latest MinIO backup
python scripts/restore.py
```

---

## Configure Real Email (SMTP)

To send real patient invite and password reset emails, configure SMTP in `.env`.

Required keys:

```bash
FRONTEND_URL=http://localhost:5173
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=<smtp-host>
EMAIL_PORT=<smtp-port>
EMAIL_HOST_USER=<smtp-username>
EMAIL_HOST_PASSWORD=<smtp-password-or-api-key>
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
DEFAULT_FROM_EMAIL=no-reply@shms.local
```

Provider examples:

```bash
# Gmail SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Mailtrap SMTP
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_HOST_USER=your-mailtrap-username
EMAIL_HOST_PASSWORD=your-mailtrap-password

# SendGrid SMTP
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
```

After updating `.env`, restart backend service:

```bash
docker-compose restart backend
```

---

## Service URLs

| Service   | URL                          | Login              |
|-----------|------------------------------|--------------------|
| Frontend  | http://localhost:5173        | See credentials above |
| Django API| http://localhost:8000/api/   | JWT token required |
| Django Admin | http://localhost:8000/admin/ | superadmin / password123 |
| Keycloak  | http://localhost:8080        | admin / admin123   |
| OPA       | http://localhost:8181        | No auth            |
| HAPI FHIR | http://localhost:8090/fhir/  | No auth            |
| MinIO     | http://localhost:9001        | minioadmin / minioadmin123 |
