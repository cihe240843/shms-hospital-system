@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo SHMS Project Creator
echo ========================================
echo.

REM Create directories
echo Creating directories...

mkdir backend\patients\migrations 2>nul
mkdir backend\inventory\migrations 2>nul
mkdir backend\billing\migrations 2>nul
mkdir backend\audit\migrations 2>nul
mkdir backend\auth\migrations 2>nul
mkdir backend\backup\migrations 2>nul
mkdir backend\policy\migrations 2>nul
mkdir backend\tests 2>nul
mkdir backend\logs 2>nul
mkdir backend\shms 2>nul
mkdir frontend\public 2>nul
mkdir frontend\src\components 2>nul
mkdir frontend\src\pages 2>nul
mkdir frontend\src\services 2>nul
mkdir config 2>nul
mkdir scripts 2>nul
mkdir docs 2>nul

echo ✓ Directories created
echo.

REM Create .gitignore
echo Creating .gitignore...
(
echo # Python
echo __pycache__/
echo *.py[cod]
echo *.pyo
echo *.pyd
echo .Python
echo *.egg
echo *.egg-info/
echo dist/
echo build/
echo eggs/
echo *.so
echo .eggs/
echo lib/
echo lib64/
echo parts/
echo sdist/
echo var/
echo wheels/
echo *.egg-info/
echo .installed.cfg
echo *.egg
echo MANIFEST
echo.
echo # Django
echo *.log
echo local_settings.py
echo db.sqlite3
echo db.sqlite3-journal
echo /media
echo /staticfiles
echo /static
echo.
echo # Environment variables
echo .env
echo .env.local
echo .env.*.local
echo .env.production
echo .env.staging
echo.
echo # Virtual Environment
echo venv/
echo env/
echo ENV/
echo .venv/
echo env.bak/
echo venv.bak/
echo.
echo # Database
echo *.sqlite3
echo *.db
echo *.sqlite
echo.
echo # AWS
echo .aws/
echo credentials
echo .s3cfg
echo.
echo # Node.js
echo node_modules/
echo npm-debug.log*
echo yarn-debug.log*
echo yarn-error.log*
echo .npm
echo package-lock.json
echo yarn.lock
echo.
echo # IDE
echo .vscode/
echo .idea/
echo *.swp
echo *.swo
echo *~
echo .DS_Store
echo *.sublime-project
echo *.sublime-workspace
echo.
echo # Testing
echo .pytest_cache/
echo .coverage
echo htmlcov/
echo .tox/
echo coverage.xml
echo *.cover
echo.
echo # Logs
echo logs/
echo *.log
echo audit.log
echo.
echo # Backup files
echo *.bak
echo *.backup
echo backups/
echo *.tmp
echo.
echo # Docker
echo .docker/
echo docker-compose.override.yml
echo.
echo # OS
echo .DS_Store
echo Thumbs.db
) > .gitignore

echo ✓ .gitignore created
echo.

REM Create .env.example
echo Creating .env.example...
(
echo # ============================================================================
echo # DJANGO SETTINGS
echo # ============================================================================
echo SECRET_KEY=your-super-secret-key-change-in-production
echo DEBUG=False
echo ALLOWED_HOSTS=localhost,127.0.0.1,shms.example.com
echo.
echo # ============================================================================
echo # DATABASE
echo # ============================================================================
echo DB_ENGINE=django.db.backends.postgresql
echo DB_NAME=shms_db
echo DB_USER=postgres
echo DB_PASSWORD=secure_password_here
echo DB_HOST=localhost
echo DB_PORT=5432
echo.
echo # ============================================================================
echo # AWS S3 BACKUP
echo # ============================================================================
echo AWS_ACCESS_KEY_ID=your-aws-access-key
echo AWS_SECRET_ACCESS_KEY=your-aws-secret-key
echo AWS_STORAGE_BUCKET_NAME=shms-backups
echo AWS_S3_REGION_NAME=us-east-1
echo.
echo # ============================================================================
echo # FHIR SERVER
echo # ============================================================================
echo FHIR_SERVER_URL=http://localhost:8080/fhir
echo FHIR_SERVER_USERNAME=admin
echo FHIR_SERVER_PASSWORD=admin
echo.
echo # ============================================================================
echo # OPA POLICY ENGINE
echo # ============================================================================
echo OPA_URL=http://localhost:8181
echo OPA_POLICY_PATH=data/shms/authz
echo.
echo # ============================================================================
echo # KEYCLOAK IDENTITY PROVIDER
echo # ============================================================================
echo KEYCLOAK_URL=http://localhost:8080/auth
echo KEYCLOAK_REALM=shms
echo KEYCLOAK_CLIENT_ID=shms-client
echo KEYCLOAK_CLIENT_SECRET=your-keycloak-secret
echo.
echo # ============================================================================
echo # CORS SETTINGS
echo # ============================================================================
echo CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
echo.
echo # ============================================================================
echo # EMAIL SETTINGS
echo # ============================================================================
echo EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
echo EMAIL_HOST=smtp.gmail.com
echo EMAIL_PORT=587
echo EMAIL_USE_TLS=True
echo EMAIL_HOST_USER=your-email@gmail.com
echo EMAIL_HOST_PASSWORD=your-app-password
echo.
echo # ============================================================================
echo # LOGGING
echo # ============================================================================
echo LOG_LEVEL=INFO
echo LOG_FILE=logs/app.log
echo AUDIT_LOG_FILE=logs/audit.log
echo.
echo # ============================================================================
echo # SECURITY
echo # ============================================================================
echo SECURE_SSL_REDIRECT=False
echo SESSION_COOKIE_SECURE=False
echo CSRF_COOKIE_SECURE=False
) > .env.example

echo ✓ .env.example created
echo.

REM Create README.md
echo Creating README.md...
(
echo # Secure Hospital Management System - SHMS
echo.
echo A comprehensive, standards-aligned secure hospital management system
echo.
echo ## Team Members
echo - Dipendra Raj Panta - CIHE250272
echo - Binaya Sapkota - CIHE241608
echo - Anuj Kandel - CIHE250332
echo - Sonish Malakar - CIHE240801
echo - Sunil Dahal - CIHE240843
echo.
echo ## Quick Start
echo.
echo 1. copy .env.example .env
echo 2. Edit .env file with your values
echo 3. docker-compose up --build
echo.
echo ## Tech Stack
echo - Backend: Django 4.2
echo - Frontend: React 18
echo - Database: PostgreSQL
echo - API: Django REST Framework
echo - Auth: JWT
) > README.md

echo ✓ README.md created
echo.

REM Create requirements.txt
echo Creating requirements.txt...
(
echo Django==4.2.7
echo djangorestframework==3.14.0
echo django-cors-headers==4.3.1
echo djangorestframework-simplejwt==5.3.2
echo psycopg2-binary==2.9.9
echo python-dotenv==1.0.0
echo requests==2.31.0
echo cryptography==41.0.7
echo boto3==1.29.7
echo gunicorn==21.2.0
echo whitenoise==6.6.0
echo pytest==7.4.3
echo pytest-django==4.7.0
echo pytest-cov==4.1.0
echo faker==21.0.0
echo PyJWT==2.8.1
echo django-filter==23.4
echo drf-yasg==1.21.7
) > requirements.txt

echo ✓ requirements.txt created
echo.

REM Create docker-compose.yml
echo Creating docker-compose.yml...
(
echo version: '3.9'
echo.
echo services:
echo   db:
echo     image: postgres:15-alpine
echo     container_name: shms-postgres
echo     environment:
echo       POSTGRES_DB: ${DB_NAME:-shms_db}
echo       POSTGRES_USER: ${DB_USER:-postgres}
echo       POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
echo     volumes:
echo       - postgres_data:/var/lib/postgresql/data
echo     ports:
echo       - "5432:5432"
echo     networks:
echo       - shms-network
echo.
echo   web:
echo     build:
echo       context: .
echo       dockerfile: Dockerfile
echo     container_name: shms-backend
echo     environment:
echo       - DEBUG=${DEBUG:-False}
echo       - SECRET_KEY=${SECRET_KEY}
echo       - DB_NAME=${DB_NAME:-shms_db}
echo       - DB_USER=${DB_USER:-postgres}
echo       - DB_PASSWORD=${DB_PASSWORD:-postgres}
echo       - DB_HOST=db
echo     ports:
echo       - "8000:8000"
echo     depends_on:
echo       - db
echo     networks:
echo       - shms-network
echo.
echo   frontend:
echo     build:
echo       context: ./frontend
echo       dockerfile: Dockerfile
echo     container_name: shms-frontend
echo     ports:
echo       - "3000:3000"
echo     depends_on:
echo       - web
echo     networks:
echo       - shms-network
echo.
echo volumes:
echo   postgres_data:
echo.
echo networks:
echo   shms-network:
echo     driver: bridge
) > docker-compose.yml

echo ✓ docker-compose.yml created
echo.

REM Create Dockerfile
echo Creating Dockerfile...
(
echo FROM python:3.11-slim
echo WORKDIR /app
echo RUN apt-get update ^&^& apt-get install -y libpq5 postgresql-client
echo COPY requirements.txt .
echo RUN pip install --no-cache-dir -r requirements.txt
echo COPY backend/ /app/
echo RUN mkdir -p /app/logs /app/staticfiles
echo EXPOSE 8000
echo CMD ["gunicorn", "shms.wsgi:application", "--bind", "0.0.0.0:8000"]
) > Dockerfile

echo ✓ Dockerfile created
echo.

REM Create nginx.conf
echo Creating nginx.conf...
(
echo user nginx;
echo worker_processes auto;
echo events { worker_connections 1024; }
echo http {
echo   upstream django_backend { server web:8000; }
echo   upstream react_frontend { server frontend:3000; }
echo   server {
echo     listen 80;
echo     location /api/ { proxy_pass http://django_backend; }
echo     location / { proxy_pass http://react_frontend; }
echo   }
echo }
) > nginx.conf

echo ✓ nginx.conf created
echo.

REM Create pytest.ini
echo Creating pytest.ini...
(
echo [pytest]
echo DJANGO_SETTINGS_MODULE = shms.settings
echo python_files = tests.py test_*.py *_tests.py
echo testpaths = backend/tests
) > pytest.ini

echo ✓ pytest.ini created
echo.

REM Create backend __init__.py
echo Creating backend __init__.py files...
(
echo.
) > backend\__init__.py

(
echo.
) > backend\patients\__init__.py

(
echo.
) > backend\inventory\__init__.py

(
echo.
) > backend\billing\__init__.py

(
echo.
) > backend\audit\__init__.py

(
echo.
) > backend\auth\__init__.py

(
echo.
) > backend\backup\__init__.py

(
echo.
) > backend\policy\__init__.py

(
echo.
) > backend\tests\__init__.py

(
echo.
) > backend\patients\migrations\__init__.py

(
echo.
) > backend\inventory\migrations\__init__.py

(
echo.
) > backend\billing\migrations\__init__.py

(
echo.
) > backend\audit\migrations\__init__.py

(
echo.
) > backend\auth\migrations\__init__.py

(
echo.
) > backend\backup\migrations\__init__.py

(
echo.
) > backend\policy\migrations\__init__.py

echo ✓ __init__.py files created
echo.

REM Create manage.py
echo Creating manage.py...
(
echo #!/usr/bin/env python
echo import os
echo import sys
echo if __name__ == "__main__":
echo     os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shms.settings"^)
echo     from django.core.management import execute_from_command_line
echo     execute_from_command_line(sys.argv^)
) > backend\manage.py

echo ✓ manage.py created
echo.

REM Create shms app files
echo Creating shms app files...
(
echo.
) > backend\shms\__init__.py

(
echo import os
echo from pathlib import Path
echo from datetime import timedelta
echo from dotenv import load_dotenv
echo load_dotenv(^)
echo BASE_DIR = Path(__file__^).resolve(^).parent.parent
echo SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-dev-key'^)
echo DEBUG = os.getenv('DEBUG', 'False'^) == 'True'
echo ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1'^).split(','^ )
echo SECURE_SSL_REDIRECT = not DEBUG
echo SESSION_COOKIE_SECURE = not DEBUG
echo CSRF_COOKIE_SECURE = not DEBUG
echo X_FRAME_OPTIONS = 'DENY'
echo INSTALLED_APPS = [
echo     'django.contrib.admin',
echo     'django.contrib.auth',
echo     'django.contrib.contenttypes',
echo     'django.contrib.sessions',
echo     'django.contrib.messages',
echo     'django.contrib.staticfiles',
echo     'rest_framework',
echo     'corsheaders',
echo     'patients',
echo     'inventory',
echo     'billing',
echo     'audit',
echo     'auth',
echo     'backup',
echo     'policy',
echo ]
echo MIDDLEWARE = [
echo     'django.middleware.security.SecurityMiddleware',
echo     'corsheaders.middleware.CorsMiddleware',
echo     'django.middleware.common.CommonMiddleware',
echo     'django.middleware.csrf.CsrfViewMiddleware',
echo     'django.contrib.auth.middleware.AuthenticationMiddleware',
echo     'django.contrib.messages.middleware.MessageMiddleware',
echo ]
echo CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000'^).split(','^ )
echo DATABASES = {
echo     'default': {
echo         'ENGINE': 'django.db.backends.postgresql',
echo         'NAME': os.getenv('DB_NAME', 'shms_db'^),
echo         'USER': os.getenv('DB_USER', 'postgres'^),
echo         'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'^),
echo         'HOST': os.getenv('DB_HOST', 'localhost'^),
echo         'PORT': os.getenv('DB_PORT', '5432'^),
echo     }
echo }
echo REST_FRAMEWORK = {
echo     'DEFAULT_AUTHENTICATION_CLASSES': [
echo         'rest_framework_simplejwt.authentication.JWTAuthentication',
echo     ],
echo     'DEFAULT_PERMISSION_CLASSES': [
echo         'rest_framework.permissions.IsAuthenticated',
echo     ],
echo }
echo SIMPLE_JWT = {
echo     'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5^),
echo     'REFRESH_TOKEN_LIFETIME': timedelta(days=1^),
echo }
echo LANGUAGE_CODE = 'en-us'
echo TIME_ZONE = 'UTC'
echo USE_I18N = True
echo USE_TZ = True
echo STATIC_URL = '/static/'
echo STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles'^)
echo DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
echo ROOT_URLCONF = 'shms.urls'
echo WSGI_APPLICATION = 'shms.wsgi.application'
) > backend\shms\settings.py

(
echo from django.contrib import admin
echo from django.urls import path
echo urlpatterns = [
echo     path('admin/', admin.site.urls^),
echo ]
) > backend\shms\urls.py

(
echo import os
echo from django.core.wsgi import get_wsgi_application
echo os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shms.settings'^)
echo application = get_wsgi_application(^)
) > backend\shms\wsgi.py

(
echo import os
echo from django.core.asgi import get_asgi_application
echo os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shms.settings'^)
echo application = get_asgi_application(^)
) > backend\shms\asgi.py

echo ✓ Shms app files created
echo.

REM Create app models files
echo Creating app models files...
(
echo from django.db import models
echo import uuid
echo class Patient(models.Model):
echo     id = models.UUIDField(primary_key=True, default=uuid.uuid4^)
echo     fhir_id = models.CharField(max_length=255, unique=True^)
echo     first_name = models.CharField(max_length=255^)
echo     last_name = models.CharField(max_length=255^)
echo     date_of_birth = models.DateField(^)
echo     gender = models.CharField(max_length=10^)
echo     email = models.EmailField(unique=True^)
echo     phone = models.CharField(max_length=20, blank=True^)
echo     address = models.TextField(^)
echo     created_at = models.DateTimeField(auto_now_add=True^)
echo     updated_at = models.DateTimeField(auto_now=True^)
echo     class Meta:
echo         db_table = 'patients'
echo     def __str__(self^):
echo         return f"{self.first_name} {self.last_name}"
) > backend\patients\models.py

(
echo from django.db import models
echo import uuid
echo class Item(models.Model):
echo     id = models.UUIDField(primary_key=True, default=uuid.uuid4^)
echo     name = models.CharField(max_length=255^)
echo     batch = models.CharField(max_length=100^)
echo     expiry = models.DateField(^)
echo     quantity = models.IntegerField(^)
echo     location = models.CharField(max_length=100^)
echo     unit_price = models.DecimalField(max_digits=10, decimal_places=2^)
echo     created_at = models.DateTimeField(auto_now_add=True^)
echo     updated_at = models.DateTimeField(auto_now=True^)
echo     class Meta:
echo         db_table = 'inventory_items'
echo     def __str__(self^):
echo         return f"{self.name} - Batch {self.batch}"
) > backend\inventory\models.py

(
echo from django.db import models
echo import uuid
echo class Invoice(models.Model):
echo     id = models.UUIDField(primary_key=True, default=uuid.uuid4^)
echo     invoice_number = models.CharField(max_length=50, unique=True^)
echo     amount = models.DecimalField(max_digits=12, decimal_places=2^)
echo     status = models.CharField(max_length=20^)
echo     issued_date = models.DateTimeField(auto_now_add=True^)
echo     due_date = models.DateField(^)
echo     created_at = models.DateTimeField(auto_now_add=True^)
echo     updated_at = models.DateTimeField(auto_now=True^)
echo     class Meta:
echo         db_table = 'invoices'
echo     def __str__(self^):
echo         return f"Invoice {self.invoice_number}"
) > backend\billing\models.py

(
echo from django.db import models
echo import uuid
echo class AuditLog(models.Model):
echo     id = models.UUIDField(primary_key=True, default=uuid.uuid4^)
echo     timestamp = models.DateTimeField(auto_now_add=True^)
echo     actor = models.CharField(max_length=255^)
echo     resource_type = models.CharField(max_length=100^)
echo     action = models.CharField(max_length=50^)
echo     status = models.CharField(max_length=20^)
echo     entry_hash = models.CharField(max_length=256, unique=True^)
echo     previous_hash = models.CharField(max_length=256, null=True, blank=True^)
echo     created_at = models.DateTimeField(auto_now_add=True^)
echo     class Meta:
echo         db_table = 'audit_logs'
echo     def __str__(self^):
echo         return f"{self.action} {self.resource_type}"
) > backend\audit\models.py

(
echo from django.db import models
echo from django.contrib.auth.models import User
echo class UserProfile(models.Model):
echo     user = models.OneToOneField(User, on_delete=models.CASCADE^)
echo     role = models.CharField(max_length=50^)
echo     department = models.CharField(max_length=100, blank=True^)
echo     created_at = models.DateTimeField(auto_now_add=True^)
echo     def __str__(self^):
echo         return f"{self.user.username} - {self.role}"
) > backend\auth\models.py

(
echo from django.db import models
echo import uuid
echo class BackupJob(models.Model):
echo     id = models.UUIDField(primary_key=True, default=uuid.uuid4^)
echo     backup_date = models.DateTimeField(auto_now_add=True^)
echo     size_bytes = models.BigIntegerField(^)
echo     status = models.CharField(max_length=20^)
echo     s3_path = models.CharField(max_length=500^)
echo     manifest_hash = models.CharField(max_length=256^)
echo     created_at = models.DateTimeField(auto_now_add=True^)
echo     class Meta:
echo         db_table = 'backup_jobs'
echo     def __str__(self^):
echo         return f"Backup {self.backup_date}"
) > backend\backup\models.py

(
echo from django.db import models
echo import uuid
echo class Policy(models.Model):
echo     id = models.UUIDField(primary_key=True, default=uuid.uuid4^)
echo     name = models.CharField(max_length=255^)
echo     description = models.TextField(^)
echo     rules = models.JSONField(^)
echo     version = models.CharField(max_length=50^)
echo     created_at = models.DateTimeField(auto_now_add=True^)
echo     updated_at = models.DateTimeField(auto_now=True^)
echo     class Meta:
echo         db_table = 'policies'
echo     def __str__(self^):
echo         return f"{self.name} v{self.version}"
) > backend\policy\models.py

echo ✓ Models created
echo.

REM Create app admin files
echo Creating admin files...
(
echo from django.contrib import admin
echo from .models import Patient
echo @admin.register(Patient^)
echo class PatientAdmin(admin.ModelAdmin^):
echo     list_display = ('first_name', 'last_name', 'email', 'created_at'^)
echo     search_fields = ('first_name', 'last_name', 'email'^)
) > backend\patients\admin.py

(
echo from django.contrib import admin
echo from .models import Item
echo @admin.register(Item^)
echo class ItemAdmin(admin.ModelAdmin^):
echo     list_display = ('name', 'batch', 'quantity', 'expiry'^)
echo     search_fields = ('name', 'batch'^)
) > backend\inventory\admin.py

(
echo from django.contrib import admin
echo from .models import Invoice
echo @admin.register(Invoice^)
echo class InvoiceAdmin(admin.ModelAdmin^):
echo     list_display = ('invoice_number', 'amount', 'status', 'due_date'^)
echo     search_fields = ('invoice_number',^)
) > backend\billing\admin.py

(
echo from django.contrib import admin
echo from .models import AuditLog
echo @admin.register(AuditLog^)
echo class AuditLogAdmin(admin.ModelAdmin^):
echo     list_display = ('timestamp', 'actor', 'action', 'status'^)
echo     search_fields = ('actor', 'resource_type'^)
echo     readonly_fields = ('entry_hash', 'previous_hash'^)
) > backend\audit\admin.py

(
echo from django.contrib import admin
echo from .models import UserProfile
echo @admin.register(UserProfile^)
echo class UserProfileAdmin(admin.ModelAdmin^):
echo     list_display = ('user', 'role', 'department'^)
echo     search_fields = ('user__username', 'role'^)
) > backend\auth\admin.py

(
echo from django.contrib import admin
echo from .models import BackupJob
echo @admin.register(BackupJob^)
echo class BackupJobAdmin(admin.ModelAdmin^):
echo     list_display = ('backup_date', 'status', 'size_bytes'^)
echo     search_fields = ('status',^)
) > backend\backup\admin.py

(
echo from django.contrib import admin
echo from .models import Policy
echo @admin.register(Policy^)
echo class PolicyAdmin(admin.ModelAdmin^):
echo     list_display = ('name', 'version', 'created_at'^)
echo     search_fields = ('name',^)
) > backend\policy\admin.py

echo ✓ Admin files created
echo.

REM Create app apps files
echo Creating apps.py files...
(
echo from django.apps import AppConfig
echo class PatientsConfig(AppConfig^):
echo     default_auto_field = 'django.db.models.BigAutoField'
echo     name = 'patients'
) > backend\patients\apps.py

(
echo from django.apps import AppConfig
echo class InventoryConfig(AppConfig^):
echo     default_auto_field = 'django.db.models.BigAutoField'
echo     name = 'inventory'
) > backend\inventory\apps.py

(
echo from django.apps import AppConfig
echo class BillingConfig(AppConfig^):
echo     default_auto_field = 'django.db.models.BigAutoField'
echo     name = 'billing'
) > backend\billing\apps.py

(
echo from django.apps import AppConfig
echo class AuditConfig(AppConfig^):
echo     default_auto_field = 'django.db.models.BigAutoField'
echo     name = 'audit'
) > backend\audit\apps.py

(
echo from django.apps import AppConfig
echo class AuthConfig(AppConfig^):
echo     default_auto_field = 'django.db.models.BigAutoField'
echo     name = 'auth'
) > backend\auth\apps.py

(
echo from django.apps import AppConfig
echo class BackupConfig(AppConfig^):
echo     default_auto_field = 'django.db.models.BigAutoField'
echo     name = 'backup'
) > backend\backup\apps.py

(
echo from django.apps import AppConfig
echo class PolicyConfig(AppConfig^):
echo     default_auto_field = 'django.db.models.BigAutoField'
echo     name = 'policy'
) > backend\policy\apps.py

echo ✓ Apps.py files created
echo.

REM Create empty files
echo Creating empty placeholder files...
(
echo.
) > backend\patients\views.py

(
echo.
) > backend\patients\serializers.py

(
echo.
) > backend\patients\urls.py

(
echo.
) > backend\patients\tests.py

(
echo.
) > backend\inventory\views.py

(
echo.
) > backend\inventory\serializers.py

(
echo.
) > backend\inventory\urls.py

(
echo.
) > backend\inventory\tests.py

(
echo.
) > backend\billing\views.py

(
echo.
) > backend\billing\serializers.py

(
echo.
) > backend\billing\urls.py

(
echo.
) > backend\billing\tests.py

(
echo.
) > backend\audit\views.py

(
echo.
) > backend\audit\serializers.py

(
echo.
) > backend\audit\urls.py

(
echo.
) > backend\audit\tests.py

(
echo.
) > backend\audit\logger.py

(
echo.
) > backend\auth\views.py

(
echo.
) > backend\auth\serializers.py

(
echo.
) > backend\auth\urls.py

(
echo.
) > backend\auth\tests.py

(
echo.
) > backend\auth\permissions.py

(
echo.
) > backend\backup\views.py

(
echo.
) > backend\backup\urls.py

(
echo.
) > backend\backup\tests.py

(
echo.
) > backend\backup\backup_service.py

(
echo.
) > backend\backup\restore_service.py

(
echo.
) > backend\policy\views.py

(
echo.
) > backend\policy\tests.py

(
echo.
) > backend\policy\opa_client.py

(
echo.
) > backend\policy\policy_service.py

(
echo.
) > backend\tests\test_integration.py

(
echo.
) > backend\tests\test_security.py

(
echo.
) > backend\tests\test_performance.py

(
echo.
) > backend\tests\test_recovery.py

(
echo.
) > backend\logs\.gitkeep

(
echo.
) > frontend\public\index.html

(
echo.
) > frontend\public\favicon.ico

(
echo.
) > frontend\src\App.js

(
echo.
) > frontend\src\App.css

(
echo.
) > frontend\src\index.js

(
echo.
) > frontend\src\index.css

(
echo.
) > frontend\src\components\PatientForm.js

(
echo.
) > frontend\src\components\PatientList.js

(
echo.
) > frontend\src\components\Navigation.js

(
echo.
) > frontend\src\components\Dashboard.js

(
echo.
) > frontend\src\pages\Login.js

(
echo.
) > frontend\src\pages\Dashboard.js

(
echo.
) > frontend\src\pages\Patients.js

(
echo.
) > frontend\src\pages\Inventory.js

(
echo.
) > frontend\src\pages\Billing.js

(
echo.
) > frontend\src\pages\Audit.js

(
echo.
) > frontend\src\services\api.js

(
echo.
) > frontend\src\services\auth.js

(
echo.
) > frontend\src\services\storage.js

(
echo.
) > frontend\Dockerfile

(
echo.
) > frontend\.env.example

(
echo.
) > config\.gitkeep

(
echo.
) > scripts\.gitkeep

(
echo.
) > docs\.gitkeep

echo ✓ Placeholder files created
echo.

echo.
echo ========================================
echo ✓ Project structure created successfully!
echo ========================================
echo.
echo Next steps:
echo 1. copy .env.example .env
echo 2. notepad .env
echo 3. Edit configuration values
echo 4. docker-compose up --build
echo.
pause