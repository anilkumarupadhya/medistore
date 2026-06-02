import uuid
from django.db import models


class Prescription(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer      = models.ForeignKey(
                        'customers.Customer',
                        on_delete=models.SET_NULL,
                        null=True, blank=True,
                        related_name='prescriptions',
                    )
    doctor_name   = models.CharField(max_length=255, blank=True, default='')
    doctor_reg_no = models.CharField(max_length=100, blank=True, default='')
    file_url      = models.CharField(max_length=1000, blank=True, default='')
    notes         = models.TextField(blank=True, default='')
    uploaded_by   = models.ForeignKey(
                        'authentication.User',
                        on_delete=models.SET_NULL,
                        null=True, blank=True,
                        related_name='prescriptions',
                        db_column='uploaded_by',
                    )
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'prescriptions'
        ordering = ['-created_at']

    def __str__(self):
        cname = self.customer.name if self.customer else 'Walk-in'
        return f'Rx {self.id} — {cname}'
