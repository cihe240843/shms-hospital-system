from django.contrib import admin
from .models import Patient, PatientProfile


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "email", "date_of_birth")
    search_fields = ("first_name", "last_name", "email")


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "patient")