from django.db import migrations
from apps.common.fields import _encrypt


def encrypt_existing_notes(apps, schema_editor):
    Appointment = apps.get_model("appointments", "Appointment")
    for appointment in Appointment.objects.all().iterator():
        encrypted = _encrypt(appointment.notes)
        if encrypted != appointment.notes:
            Appointment.objects.filter(pk=appointment.pk).update(notes=encrypted)


class Migration(migrations.Migration):

    dependencies = [
        ("appointments", "0002_encrypt_notes"),
    ]

    operations = [
        migrations.RunPython(encrypt_existing_notes, migrations.RunPython.noop),
    ]
