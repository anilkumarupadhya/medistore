import uuid
from django.db import models


class Customer(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name            = models.CharField(max_length=255)
    mobile          = models.CharField(max_length=20, unique=True)
    email           = models.EmailField(max_length=254, null=True, blank=True)
    address         = models.TextField(blank=True, default='')
    date_of_birth   = models.DateField(null=True, blank=True)
    loyalty_points  = models.IntegerField(default=0)
    opening_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    is_active       = models.BooleanField(default=True)
    notes           = models.TextField(blank=True, default='')
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.mobile})'
