import hashlib
from django.db import models
from django.contrib.auth.models import User

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20)
    resource = models.CharField(max_length=50)
    resource_id = models.CharField(max_length=100, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    row_hash = models.CharField(max_length=64, blank=True)
    prev_hash = models.CharField(max_length=64, blank=True)

    class Meta:
        ordering = ["id"]

    def save(self, *args, **kwargs):
        if self.pk:
            raise Exception("AuditLog is append-only")
        last = AuditLog.objects.order_by("-id").first()
        prev = last.row_hash if last else "0" * 64
        self.prev_hash = prev
        data = f"{self.user_id}{self.action}{self.resource}{self.resource_id}{self.ip_address}{prev}"
        self.row_hash = hashlib.sha256(data.encode()).hexdigest()
        super().save(*args, **kwargs)
