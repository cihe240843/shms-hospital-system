import uuid
from django.db import models

class InventoryItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, default="General")
    quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=50)
    unit = models.CharField(max_length=50, default="units")
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_low_stock(self):
        return self.quantity < self.low_stock_threshold

    def __str__(self):
        return self.name
