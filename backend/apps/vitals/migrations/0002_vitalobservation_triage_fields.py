from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vitals", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="vitalobservation",
            name="chief_complaint",
            field=models.CharField(default="", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="vitalobservation",
            name="allergy_notes",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="vitalobservation",
            name="triage_notes",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="vitalobservation",
            name="pain_score",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="vitalobservation",
            name="height_cm",
            field=models.DecimalField(blank=True, decimal_places=1, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name="vitalobservation",
            name="weight_kg",
            field=models.DecimalField(blank=True, decimal_places=1, max_digits=5, null=True),
        ),
    ]
