from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    def get_username(self, obj):
        return obj.user.username if obj.user else "system"
    class Meta:
        model = AuditLog
        fields = "__all__"
