"""
InventoryTransaction model — maps to `inventory_transactions` table.
All stock changes go through this model to maintain a full audit trail.
"""
from django.db import models


class TxType(models.TextChoices):
    STOCK_IN    = "STOCK_IN",    "Stock In"
    STOCK_OUT   = "STOCK_OUT",   "Stock Out"
    ADJUSTMENT  = "ADJUSTMENT",  "Adjustment"
    RETURN      = "RETURN",      "Return"
    EXPIRED     = "EXPIRED",     "Expired"
    DAMAGED     = "DAMAGED",     "Damaged"


class InventoryTransaction(models.Model):
    """
    Immutable ledger entry for every stock movement.
    The `quantity_before` and `quantity_after` fields provide a complete
    stock-level timeline for any medicine.
    """
    medicine       = models.ForeignKey(
                         "medicines.Medicine",
                         on_delete=models.RESTRICT,
                         related_name="inventory_transactions",
                     )
    tx_type        = models.CharField(max_length=20, choices=TxType.choices, db_index=True)
    quantity       = models.IntegerField()
    quantity_before = models.IntegerField()
    quantity_after  = models.IntegerField()
    batch_number   = models.CharField(max_length=100, blank=True, default="")
    expiry_date    = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    selling_price  = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    reference_type = models.CharField(max_length=50, blank=True, default="")
    reference_id   = models.UUIDField(null=True, blank=True)
    reason         = models.TextField(blank=True, default="")
    created_by     = models.ForeignKey(
                         "authentication.User",
                         on_delete=models.SET_NULL,
                         null=True, blank=True,
                         related_name="inventory_transactions",
                         db_column="created_by",
                     )
    created_at     = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "inventory_transactions"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.tx_type} | {self.medicine} | qty={self.quantity}"
