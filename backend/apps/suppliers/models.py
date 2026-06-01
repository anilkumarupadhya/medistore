"""
Supplier model — maps to the `suppliers` table created by schema.sql.
"""
import uuid
from django.db import models
from apps.core.models import TimeStampedModel


class Supplier(TimeStampedModel):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name            = models.CharField(max_length=255, db_index=True)
    contact_person  = models.CharField(max_length=150, blank=True, default='')
    mobile          = models.CharField(max_length=20, unique=True)
    email           = models.EmailField(null=True, blank=True)
    address         = models.TextField(blank=True, default='')
    city            = models.CharField(max_length=100, blank=True, default='')
    state           = models.CharField(max_length=100, blank=True, default='')
    pincode         = models.CharField(max_length=10, blank=True, default='')
    gst_number      = models.CharField(max_length=20, null=True, blank=True)
    payment_terms   = models.SmallIntegerField(default=30)   # days
    opening_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    is_active       = models.BooleanField(default=True, db_index=True)
    notes           = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'suppliers'
        ordering = ['name']

    def __str__(self) -> str:
        return self.name
