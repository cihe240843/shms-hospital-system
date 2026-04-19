from pathlib import Path
import base64
import hashlib
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY", default="dev-secret-key-change-in-production")
DEBUG = config("DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "apps.patients",
    "apps.appointments",
    "apps.inventory",
    "apps.billing",
    "apps.audit",
    "apps.vitals",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "apps.audit.middleware.AuditRequestMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="shms"),
        "USER": config("DB_USER", default="shms_user"),
        "PASSWORD": config("DB_PASSWORD", default="shms_pass_dev"),
        "HOST": config("DB_HOST", default="db"),
        "PORT": config("DB_PORT", default="5432"),
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost:\\d+$",
    r"^http://127\\.0\\.0\\.1:\\d+$",
]

CORS_ALLOW_CREDENTIALS = True

STATIC_URL = "/static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

FHIR_BASE_URL = config("FHIR_BASE_URL", default="http://localhost:8090/fhir")
OPA_URL = config("OPA_URL", default="http://localhost:8181")
MINIO_USER = config("MINIO_USER", default="minioadmin")
MINIO_PASSWORD = config("MINIO_PASSWORD", default="minioadmin123")
MINIO_BUCKET = config("MINIO_BUCKET", default="shms-backups")

FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:5173")
EMAIL_BACKEND = config("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = config("EMAIL_HOST", default="localhost")
EMAIL_PORT = config("EMAIL_PORT", default=25, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=False, cast=bool)
EMAIL_USE_SSL = config("EMAIL_USE_SSL", default=False, cast=bool)
EMAIL_TIMEOUT = config("EMAIL_TIMEOUT", default=10, cast=int)
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="no-reply@shms.local")
DEMO_MFA_EMAIL = config("DEMO_MFA_EMAIL", default="testusers843@gmail.com")
FIELD_ENCRYPTION_KEY = config(
    "FIELD_ENCRYPTION_KEY",
    default=base64.urlsafe_b64encode(hashlib.sha256(SECRET_KEY.encode("utf-8")).digest()).decode("ascii"),
)

# Authentication security (brute-force + MFA)
AUTH_MAX_FAILED_ATTEMPTS = config("AUTH_MAX_FAILED_ATTEMPTS", default=5, cast=int)
AUTH_LOCKOUT_MINUTES = config("AUTH_LOCKOUT_MINUTES", default=15, cast=int)
AUTH_OTP_EXPIRY_MINUTES = config("AUTH_OTP_EXPIRY_MINUTES", default=5, cast=int)
AUTH_OTP_LENGTH = config("AUTH_OTP_LENGTH", default=6, cast=int)
