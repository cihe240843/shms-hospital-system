from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("user", "action", "resource", "resource_id", "timestamp")
    list_filter = ("action", "resource", "timestamp")
    search_fields = ("resource_id", "user__username")