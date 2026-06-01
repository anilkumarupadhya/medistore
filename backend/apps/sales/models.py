import uuid
from django.db import models
from django.utils import timezone


class SaleStatus(models.TextChoices):
    COMPLETED = 'COMPLETED', 'Completed'
    RETURNED  = 'RETURNED',  'Returned'
    CANCELLED = 'CANCELLED', 'Cancelled'


class PaymentMethod(models.TextChoices):
    CASH       = 'CASH',       'Cash'
    CARD       = 'CARD',       'Card'
    UPI        = 'UPI',        'UPI'
    NETBANKING = 'NETBANKING', 'Net Banking'
    CHEQUE     = 'CHEQUE',     'Cheque'
    CREDIT     = 'CREDIT',     'Credit'


class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PARTIAL = 'PARTIAL', 'Partial'
    PAID    = 'PAID',    'Paid'
    OVERDUE = 'OVERDUE', 'Overdue'


def generate_invoice_number() -> str:
    date_str = timezone.now().strftime('%Y%m%d')
    prefix   = f'SALE-{date_str}-'
    count    = Sale.objects.filter(invoice_number__startswith=prefix).count()
    return f'{prefix}{count + 1:04d}'


class Sale(models.Model):
    id                    = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number        = models.CharField(max_length=50, unique=True, blank=True)
    customer              = models.ForeignKey(
                                'customers.Customer',
                                on_delete=models.SET_NULL,
                                null=True, blank=True,
                                related_name='sales',
                            )
    status                = models.CharField(
                                max_length=15,
                                choices=SaleStatus.choices,
                                default=SaleStatus.COMPLETED,
                                db_index=True,
                            )
    subtotal              = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount_amount       = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax_amount            = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount          = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_paid           = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    change_amount         = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    payment_method        = models.CharField(
                                max_length=15,
                                choices=PaymentMethod.choices,
                                default=PaymentMethod.CASH,
                            )
    payment_status        = models.CharField(
                                max_length=10,
                                choices=PaymentStatus.choices,
                                default=PaymentStatus.PAID,
                            )
    loyalty_points_used   = models.IntegerField(default=0)
    loyalty_points_earned = models.IntegerField(default=0)
    notes                 = models.TextField(blank=True, default='')
    created_by            = models.ForeignKey(
                                'authentication.User',
                                on_delete=models.SET_NULL,
                                null=True, blank=True,
                                related_name='sales',
                                db_column='created_by',
                            )
    created_at            = models.DateTimeField(auto_now_add=True)
    updated_at            = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sales'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = generate_invoice_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.invoice_number


class SaleItem(models.Model):
    sale            = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    medicine        = models.ForeignKey(
                          'medicines.Medicine',
                          on_delete=models.RESTRICT,
                          related_name='sale_items',
                      )
    batch_number    = models.CharField(max_length=100, blank=True, default='')
    expiry_date     = models.DateField(null=True, blank=True)
    quantity        = models.IntegerField()
    unit_price      = models.DecimalField(max_digits=12, decimal_places=2)
    mrp             = models.DecimalField(max_digits=12, decimal_places=2)
    discount_pct    = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gst_percentage  = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    gst_amount      = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount    = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        db_table = 'sale_items'

    def __str__(self):
        return f'{self.sale.invoice_number} – {self.medicine.name}'
