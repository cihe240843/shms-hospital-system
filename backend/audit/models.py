import uuid
import hashlib
from django.db import models
from django.contrib.auth.models import User

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("CREATE", "Create"),
        ("READ", "Read"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    resource = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    # 🔐 Security fields
    previous_hash = models.CharField(max_length=64, blank=True)
    hash = models.CharField(max_length=64, editable=False)

    def compute_hash(self):
        data = f"{self.user_id}{self.action}{self.resource}{self.resource_id}{self.timestamp}{self.previous_hash}"
        return hashlib.sha256(data.encode()).hexdigest()

    def save(self, *args, **kwargs):
        if not self.pk:
            last_log = AuditLog.objects.order_by("-timestamp").first()
            self.previous_hash = last_log.hash if last_log else ""
            self.hash = self.compute_hash()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} {self.action} {self.resource}"