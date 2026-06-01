"""
Management command: python manage.py seed_data

Creates default users for each role so the system is immediately usable
after a fresh docker-compose up.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.authentication.models import User, Role


SEED_USERS = [
    {
        "email": "admin@medistore.com",
        "first_name": "System",
        "last_name": "Admin",
        "password": "Admin@1234",
        "role": Role.ADMIN,
        "is_staff": True,
        "is_superuser": True,
        "phone": "+91-9000000001",
    },
    {
        "email": "pharmacist@medistore.com",
        "first_name": "Ravi",
        "last_name": "Sharma",
        "password": "Pharma@1234",
        "role": Role.PHARMACIST,
        "phone": "+91-9000000002",
    },
    {
        "email": "cashier@medistore.com",
        "first_name": "Priya",
        "last_name": "Patel",
        "password": "Cashier@1234",
        "role": Role.CASHIER,
        "phone": "+91-9000000003",
    },
    {
        "email": "inventory@medistore.com",
        "first_name": "Amit",
        "last_name": "Verma",
        "password": "Inventory@1234",
        "role": Role.INVENTORY_MANAGER,
        "phone": "+91-9000000004",
    },
]


class Command(BaseCommand):
    help = "Seed the database with default users for all roles."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding default users..."))
        created = 0
        skipped = 0

        for user_data in SEED_USERS:
            email = user_data["email"]
            if User.objects.filter(email=email).exists():
                self.stdout.write(f"  SKIP  {email} (already exists)")
                skipped += 1
                continue

            password = user_data.pop("password")
            user = User(**user_data)
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"  CREATE {email} [{user.role}]"))
            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone — {created} user(s) created, {skipped} skipped."
            )
        )
        if created:
            self.stdout.write(
                self.style.WARNING(
                    "\nDefault credentials (change after first login):\n"
                    "  admin@medistore.com       → Admin@1234\n"
                    "  pharmacist@medistore.com  → Pharma@1234\n"
                    "  cashier@medistore.com     → Cashier@1234\n"
                    "  inventory@medistore.com   → Inventory@1234\n"
                )
            )
