"""
Abstract base models shared across all apps.
"""
import uuid
from django.db import models


class TimeStampedModel(models.Model):
    """
    Abstract model that adds created_at and updated_at fields to every model
    that inherits from it.
    """

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class UUIDModel(TimeStampedModel):
    """
    Abstract model using UUID as primary key.
    Use for entities exposed via API to avoid enumeration attacks.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True
