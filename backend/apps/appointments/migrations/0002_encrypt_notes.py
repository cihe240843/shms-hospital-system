from django.db import migrations, models


def encrypt_existing_appointments(apps, schema_editor):
    Appointment = apps.get_model("appointments", "Appointment")
    for appointment in Appointment.objects.all().iterator():
        appointment.save(update_fields=["notes"])


class Migration(migrations.Migration):

    dependencies = [
        ("appointments", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="appointment",
            name="notes",
            field=models.TextField(blank=True),
        ),
        migrations.RunPython(encrypt_existing_appointments, migrations.RunPython.noop),
    ]
