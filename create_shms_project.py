#!/usr/bin/env python3
"""
SHMS Project Structure Creator
This script creates the complete SHMS project structure for Windows
Run: python create_shms_project.py
"""

import os
import sys
from pathlib import Path

# Define project root
PROJECT_NAME = "shms-hospital-system"
PROJECT_ROOT = Path.home() / "Desktop" / PROJECT_NAME

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

# ============================================================================
# FILE CONTENTS
# ============================================================================

FILES = {
    # Root level files
    ".gitignore": """# Python
__pycache__/
*.py[cod]
*.pyo
*.pyd
.Python
*.egg
*.egg-info/
dist/
build/
eggs/
*.so
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal
/media
/staticfiles
/static

# Environment variables - NEVER COMMIT
.env
.env.local
.env.*.local
.env.production
.env.staging

# Virtual Environment
venv/
env/
ENV/
.venv/
env.bak/
venv.bak/

# Database
*.sqlite3
*.db
*.sqlite

# AWS
.aws/
credentials
.s3cfg

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.npm
package-lock.json
yarn.lock

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
*.sublime-project
*.sublime-workspace

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/
coverage.xml
*.cover

# Logs
logs/
*.log
audit.log

# Backup files
*.bak
*.backup
backups/
*.tmp

# Docker
.docker/
docker-compose.override.yml

# OS
.DS_Store
Thumbs.db
""",

    ".env.example": """# ============================================================================
# DJANGO SETTINGS
# ============================================================================
SECRET_KEY=your-super-secret-key-change-in-production
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,shms.example.com

# ============================================================================
# DATABASE
# ============================================================================
DB_ENGINE=django.db.backends.postgresql
DB_NAME=shms_db
DB_USER=postgres
DB_PASSWORD=secure_password_here
DB_HOST=localhost
DB_PORT=5432

# ============================================================================
# AWS S3 BACKUP
# ============================================================================
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=shms-backups
AWS_S3_REGION_NAME=us-east-1

# ============================================================================
# FHIR SERVER
# ============================================================================
FHIR_SERVER_URL=http://localhost:8080/fhir
FHIR_SERVER_USERNAME=admin
FHIR_SERVER_PASSWORD=admin

# ============================================================================
# OPA POLICY ENGINE
# ============================================================================
OPA_URL=http://localhost:8181
OPA_POLICY_PATH=data/shms/authz

# ============================================================================
# KEYCLOAK IDENTITY PROVIDER
# ============================================================================
KEYCLOAK_URL=http://localhost:8080/auth
KEYCLOAK_REALM=shms
KEYCLOAK_CLIENT_ID=shms-client
KEYCLOAK_CLIENT_SECRET=your-keycloak-secret

# ============================================================================
# CORS SETTINGS
# ============================================================================
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# ============================================================================
# EMAIL SETTINGS
# ============================================================================
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
AUDIT_LOG_FILE=logs/audit.log

# ============================================================================
# SECURITY
# ============================================================================
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
""",

    "README.md": """# Secure Hospital Management System (SHMS)

A comprehensive, standards-aligned secure hospital management system for patient data,
inventory, and billing with emphasis on privacy, security, and auditability.

## 📋 Project Overview

This project implements a clinic-scale SHMS that integrates:
- **HL7 FHIR** for clinical data interoperability
- **SMART on FHIR** for app authorization
- **Django REST Framework** for backend services
- **Open Policy Agent (OPA)** for centralized access control
- **Tamper-evident audit logging** for accountability
- **Immutable backups** with integrity verification
- **React.js** for frontend UI

## 👥 Team Members

| Name | ID | Role |
|------|----|----|
| Dipendra Raj Panta | CIHE250272 | Project Manager, System Design |
| Binaya Sapkota | CIHE241608 | FHIR/API Developer |
| Anuj Kandel | CIHE250332 | Gateway/Edge Specialist |
| Sonish Malakar | CIHE240801 | Backup & Recovery Lead |
| Sunil Dahal | CIHE240843 | Audit/Compliance Analyst |

**Supervisor:** Dr Nam Hoai Chu (Crown Institute of Higher Education)

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python 3.11 + Django 4.2 |
| API | Django REST Framework |
| Database | PostgreSQL 14 |
| Authentication | JWT + SMART on FHIR |
| Authorization | Open Policy Agent (OPA) |
| Frontend | React.js 18 |
| Backup Storage | AWS S3 with Object Lock |
| Identity Provider | Keycloak |
| API Gateway | Nginx |
| Containerization | Docker & Docker Compose |
| Testing | Pytest, Jest, k6 |

## 🚀 Quick Start

### Prerequisites
- Docker Desktop for Windows
- Python 3.11+
- Node.js 18+
- Git

### 1. Clone Repository

```bash
git clone https://github.com/your-username/shms-hospital-system.git
cd shms-hospital-system