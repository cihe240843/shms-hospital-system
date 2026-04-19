from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('patients', '0002_patient_primary_doctor'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='invitation_accepted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='patient',
            name='invitation_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='patient',
            name='invitation_sent_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='patient',
            name='invitation_token',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='patient',
            name='user',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='patient_profile', to=settings.AUTH_USER_MODEL),
        ),
    ]
