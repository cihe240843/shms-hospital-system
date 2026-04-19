import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models

ENCRYPTION_PREFIX = "enc:"


def _build_fernet():
    key = getattr(settings, "FIELD_ENCRYPTION_KEY", None)
    if not key:
        secret = getattr(settings, "SECRET_KEY", "shms-dev-secret")
        key = base64.urlsafe_b64encode(hashlib.sha256(secret.encode("utf-8")).digest()).decode("ascii")
    if isinstance(key, str):
        key = key.encode("ascii")
    return Fernet(key)


def _decrypt_if_needed(value):
    if value in (None, ""):
        return value
    if not isinstance(value, str) or not value.startswith(ENCRYPTION_PREFIX):
        return value
    token = value[len(ENCRYPTION_PREFIX):].encode("ascii")
    try:
        return _build_fernet().decrypt(token).decode("utf-8")
    except InvalidToken:
        return value


def _encrypt(value):
    if value in (None, ""):
        return value
    if not isinstance(value, str):
        value = str(value)
    if value.startswith(ENCRYPTION_PREFIX):
        return value
    token = _build_fernet().encrypt(value.encode("utf-8")).decode("ascii")
    return f"{ENCRYPTION_PREFIX}{token}"


class EncryptedTextField(models.TextField):
    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        return _encrypt(value)

    def from_db_value(self, value, expression, connection):
        return _decrypt_if_needed(value)

    def to_python(self, value):
        return _decrypt_if_needed(value)
