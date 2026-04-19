from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0003_patient_onboarding_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='password_reset_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='patient',
            name='password_reset_sent_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='patient',
            name='password_reset_token',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
