from django.db import migrations, models


def encrypt_existing_vitals(apps, schema_editor):
    VitalObservation = apps.get_model("vitals", "VitalObservation")
    for vital in VitalObservation.objects.all().iterator():
        vital.save(update_fields=["chief_complaint", "allergy_notes", "triage_notes"])


class Migration(migrations.Migration):

    dependencies = [
        ("vitals", "0002_vitalobservation_triage_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="vitalobservation",
            name="chief_complaint",
            field=models.TextField(),
        ),
        migrations.AlterField(
            model_name="vitalobservation",
            name="allergy_notes",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="vitalobservation",
            name="triage_notes",
            field=models.TextField(blank=True),
        ),
        migrations.RunPython(encrypt_existing_vitals, migrations.RunPython.noop),
    ]
