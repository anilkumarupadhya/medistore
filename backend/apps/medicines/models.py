"""
Medicine model — maps directly to the `medicines` table created by schema.sql.
"""
import uuid
from django.db import models
from django.db.models import F
from django.utils import timezone
from datetime import timedelta
from apps.core.models import TimeStampedModel


class MedicineCategory(models.TextChoices):
    TABLET      = "TABLET",      "Tablet"
    CAPSULE     = "CAPSULE",     "Capsule"
    SYRUP       = "SYRUP",       "Syrup"
    INJECTION   = "INJECTION",   "Injection"
    OINTMENT    = "OINTMENT",    "Ointment"
    DROPS       = "DROPS",       "Drops"
    INHALER     = "INHALER",     "Inhaler"
    POWDER      = "POWDER",      "Powder"
    SUPPOSITORY = "SUPPOSITORY", "Suppository"
    PATCH       = "PATCH",       "Patch"
    OTHER       = "OTHER",       "Other"


class MedicineManager(models.Manager):
    def active(self):
        return self.filter(is_active=True)

    def low_stock(self):
        return self.active().filter(stock_quantity__lte=F("reorder_level"))

    def expiring_soon(self, days: int = 30):
        cutoff = timezone.now().date() + timedelta(days=days)
        return self.active().filter(
            expiry_date__isnull=False,
            expiry_date__lte=cutoff,
            expiry_date__gte=timezone.now().date(),
        )


class Medicine(TimeStampedModel):
    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name               = models.CharField(max_length=255, db_index=True)
    generic_name       = models.CharField(max_length=255, blank=True, default="")
    brand_name         = models.CharField(max_length=255, blank=True, default="")
    category           = models.CharField(
                             max_length=20,
                             choices=MedicineCategory.choices,
                             default=MedicineCategory.OTHER,
                             db_index=True,
                         )
    manufacturer       = models.CharField(max_length=255, blank=True, default="")
    barcode            = models.CharField(max_length=100, unique=True, null=True, blank=True)
    batch_number       = models.CharField(max_length=100, blank=True, default="")
    purchase_price     = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price      = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    mrp                = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gst_percentage     = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    hsn_code           = models.CharField(max_length=20, blank=True, default="")
    stock_quantity     = models.IntegerField(default=0)
    reorder_level      = models.IntegerField(default=10)
    unit               = models.CharField(max_length=30, default="Strip")
    manufacturing_date = models.DateField(null=True, blank=True)
    expiry_date        = models.DateField(null=True, blank=True, db_index=True)
    is_prescription    = models.BooleanField(default=False)
    is_active          = models.BooleanField(default=True, db_index=True)
    notes              = models.TextField(blank=True, default="")
    created_by         = models.ForeignKey(
                             "authentication.User",
                             on_delete=models.SET_NULL,
                             null=True, blank=True,
                             related_name="medicines_created",
                             db_column="created_by",
                         )

    objects = MedicineManager()

    class Meta:
        db_table = "medicines"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.batch_number or 'no batch'})"

    @property
    def is_low_stock(self) -> bool:
        return self.stock_quantity <= self.reorder_level

    @property
    def is_expired(self) -> bool:
        return bool(self.expiry_date and self.expiry_date < timezone.now().date())
