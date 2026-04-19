from django.db import migrations, models


def encrypt_existing_patients(apps, schema_editor):
    Patient = apps.get_model("patients", "Patient")
    for patient in Patient.objects.all().iterator():
        patient.save(update_fields=["fhir_id", "medicare_number", "phone", "address"])


class Migration(migrations.Migration):

    dependencies = [
        ("patients", "0004_patient_password_reset_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="patient",
            name="fhir_id",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="patient",
            name="medicare_number",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="patient",
            name="phone",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="patient",
            name="address",
            field=models.TextField(blank=True),
        ),
        migrations.RunPython(encrypt_existing_patients, migrations.RunPython.noop),
    ]
