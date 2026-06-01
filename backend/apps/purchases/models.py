"""
PurchaseOrder and PurchaseItem models — map to purchase_orders / purchase_items tables.
"""
import uuid
from django.db import models
from django.utils import timezone


class PurchaseStatus(models.TextChoices):
    DRAFT              = 'DRAFT',              'Draft'
    ORDERED            = 'ORDERED',            'Ordered'
    PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED', 'Partially Received'
    RECEIVED           = 'RECEIVED',           'Received'
    CANCELLED          = 'CANCELLED',          'Cancelled'


class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PARTIAL = 'PARTIAL', 'Partial'
    PAID    = 'PAID',    'Paid'
    OVERDUE = 'OVERDUE', 'Overdue'


class PaymentMethod(models.TextChoices):
    CASH       = 'CASH',       'Cash'
    CARD       = 'CARD',       'Card'
    UPI        = 'UPI',        'UPI'
    NETBANKING = 'NETBANKING', 'Net Banking'
    CHEQUE     = 'CHEQUE',     'Cheque'
    CREDIT     = 'CREDIT',     'Credit'


def generate_po_number() -> str:
    date_str = timezone.now().strftime('%Y%m%d')
    prefix   = f'PO-{date_str}-'
    count    = PurchaseOrder.objects.filter(po_number__startswith=prefix).count()
    return f'{prefix}{count + 1:04d}'


class PurchaseOrder(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    po_number       = models.CharField(max_length=50, unique=True, blank=True)
    supplier        = models.ForeignKey(
                          'suppliers.Supplier',
                          on_delete=models.RESTRICT,
                          related_name='purchase_orders',
                      )
    status          = models.CharField(
                          max_length=20,
                          choices=PurchaseStatus.choices,
                          default=PurchaseStatus.DRAFT,
                          db_index=True,
                      )
    invoice_number  = models.CharField(max_length=100, blank=True, null=True)
    invoice_date    = models.DateField(null=True, blank=True)
    subtotal        = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax_amount      = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount    = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_paid     = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    payment_status  = models.CharField(
                          max_length=10,
                          choices=PaymentStatus.choices,
                          default=PaymentStatus.PENDING,
                      )
    payment_method  = models.CharField(
                          max_length=15,
                          choices=PaymentMethod.choices,
                          null=True, blank=True,
                      )
    notes           = models.TextField(blank=True, default='')
    received_at     = models.DateTimeField(null=True, blank=True)
    created_by      = models.ForeignKey(
                          'authentication.User',
                          on_delete=models.SET_NULL,
                          null=True, blank=True,
                          related_name='purchase_orders',
                          db_column='created_by',
                      )
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'purchase_orders'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.po_number:
            self.po_number = generate_po_number()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.po_number

    def recalculate_totals(self):
        """Recompute subtotal / tax / total from line items."""
        from django.db.models import Sum
        agg = self.items.aggregate(
            sub=Sum('total_amount'),
            tax=Sum('gst_amount'),
        )
        self.subtotal        = agg['sub'] or 0
        self.tax_amount      = agg['tax'] or 0
        self.total_amount    = self.subtotal - self.discount_amount
        # payment_status
        paid = float(self.amount_paid)
        total = float(self.total_amount)
        if paid <= 0:
            self.payment_status = PaymentStatus.PENDING
        elif paid < total:
            self.payment_status = PaymentStatus.PARTIAL
        else:
            self.payment_status = PaymentStatus.PAID
        self.save(update_fields=[
            'subtotal', 'tax_amount', 'total_amount', 'payment_status', 'updated_at',
        ])


class PurchaseItem(models.Model):
    purchase       = models.ForeignKey(
                         PurchaseOrder,
                         on_delete=models.CASCADE,
                         related_name='items',
                     )
    medicine       = models.ForeignKey(
                         'medicines.Medicine',
                         on_delete=models.RESTRICT,
                         related_name='purchase_items',
                     )
    batch_number   = models.CharField(max_length=100, blank=True, default='')
    expiry_date    = models.DateField(null=True, blank=True)
    quantity       = models.IntegerField()
    free_quantity  = models.IntegerField(default=0)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price  = models.DecimalField(max_digits=12, decimal_places=2)
    mrp            = models.DecimalField(max_digits=12, decimal_places=2)
    discount_pct   = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    gst_amount     = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount   = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        db_table = 'purchase_items'

    def __str__(self) -> str:
        return f'{self.purchase.po_number} – {self.medicine.name}'
