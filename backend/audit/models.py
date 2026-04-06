import uuid
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

    def __str__(self):
        return f"{self.user} {self.action} {self.resource} ({self.resource_id})"