# Entity Relationship Diagram — MediStore Pro

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIP DIAGRAM                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────────┐
│    USERS     │         │   AUDIT_LOGS     │
├──────────────┤  1  *   ├──────────────────┤
│ PK id (uuid) │────────>│ PK id (bigserial)│
│ email        │         │ FK user_id       │
│ first_name   │         │ action (enum)    │
│ last_name    │         │ resource         │
│ phone        │         │ resource_id      │
│ password     │         │ ip_address       │
│ role (enum)  │         │ user_agent       │
│ avatar       │         │ extra_data (json)│
│ is_active    │         │ success          │
│ is_staff     │         │ created_at       │
│ last_login   │         └──────────────────┘
│ created_at   │
│ updated_at   │
└──────┬───────┘
       │ created_by
       │
       ▼ (FK in many tables below)


┌─────────────────────┐    1      *    ┌──────────────────────┐
│    SUPPLIERS        │───────────────>│   PURCHASE_ORDERS    │
├─────────────────────┤                ├──────────────────────┤
│ PK id (uuid)        │                │ PK id (uuid)         │
│ name                │                │ FK supplier_id       │
│ contact_person      │                │ po_number (unique)   │
│ mobile (unique)     │                │ status (enum)        │
│ email               │                │ invoice_number       │
│ address, city       │                │ subtotal             │
│ gst_number          │                │ discount_amount      │
│ payment_terms       │                │ tax_amount           │
│ opening_balance     │                │ total_amount         │
│ is_active           │                │ amount_paid          │
│ created_at          │                │ payment_status       │
└─────────────────────┘                │ payment_method       │
                                       │ FK created_by        │
                                       │ created_at           │
                                       └──────────┬───────────┘
                                                  │ 1
                                                  │
                                                  ▼ *
                                       ┌──────────────────────┐
                                       │   PURCHASE_ITEMS     │
                                       ├──────────────────────┤
                                       │ PK id (bigserial)    │
                                       │ FK purchase_id       │
                                       │ FK medicine_id ─────┐│
                                       │ batch_number        ││
                                       │ expiry_date         ││
                                       │ quantity            ││
                                       │ purchase_price      ││
                                       │ selling_price       ││
                                       │ gst_percentage      ││
                                       │ total_amount        ││
                                       └─────────────────────┘│
                                                              │
                                                              │
┌──────────────────────┐                                      │
│     MEDICINES        │◄─────────────────────────────────────┘
├──────────────────────┤         (also FK in sale_items,
│ PK id (uuid)         │          inventory_transactions)
│ name                 │
│ generic_name         │    1    *   ┌────────────────────────┐
│ brand_name           │────────────>│ INVENTORY_TRANSACTIONS │
│ category (enum)      │            ├────────────────────────┤
│ manufacturer         │            │ PK id (bigserial)      │
│ barcode (unique)     │            │ FK medicine_id         │
│ batch_number         │            │ tx_type (enum)         │
│ purchase_price       │            │ quantity               │
│ selling_price        │            │ quantity_before/after  │
│ mrp                  │            │ batch_number           │
│ gst_percentage       │            │ reference_type         │
│ stock_quantity       │            │ reference_id           │
│ reorder_level        │            │ FK created_by          │
│ expiry_date          │            │ created_at             │
│ is_prescription      │            └────────────────────────┘
│ is_active            │
│ FK created_by        │
│ created_at           │
└──────────────────────┘
         │
         │ FK medicine_id
         ▼ * (in sale_items)

┌────────────────────┐  1    *   ┌────────────────────┐
│    CUSTOMERS       │──────────>│      SALES         │
├────────────────────┤           ├────────────────────┤
│ PK id (uuid)       │           │ PK id (uuid)       │
│ name               │           │ FK customer_id     │
│ mobile (unique)    │           │ FK prescription_id │
│ email              │           │ invoice_number     │
│ address            │           │   (unique)         │
│ date_of_birth      │           │ status (enum)      │
│ loyalty_points     │           │ subtotal           │
│ opening_balance    │           │ discount_amount    │
│ is_active          │           │ tax_amount         │
│ created_at         │           │ total_amount       │
└────────────────────┘           │ amount_paid        │
                                 │ payment_method     │
                                 │ loyalty_points_used│
                                 │ FK created_by      │
                                 │ created_at         │
                                 └────────┬───────────┘
                                          │ 1
                                          ▼ *
                                 ┌────────────────────┐
                                 │    SALE_ITEMS      │
                                 ├────────────────────┤
                                 │ PK id (bigserial)  │
                                 │ FK sale_id         │
                                 │ FK medicine_id     │
                                 │ batch_number       │
                                 │ quantity           │
                                 │ unit_price         │
                                 │ discount_pct       │
                                 │ gst_percentage     │
                                 │ total_amount       │
                                 └────────────────────┘

┌──────────────────────┐
│   PRESCRIPTIONS      │
├──────────────────────┤
│ PK id (uuid)         │
│ FK customer_id       │
│ doctor_name          │
│ doctor_reg_no        │
│ file_url (S3)        │
│ s3_key               │
│ FK uploaded_by       │
│ created_at           │
└──────────────────────┘
         ▲
         │ FK prescription_id
         │
    SALES (optional link)

┌──────────────────────┐
│     PAYMENTS         │
├──────────────────────┤
│ PK id (uuid)         │
│ reference_type       │  ← 'SALE' or 'PURCHASE'
│ reference_id (uuid)  │  ← polymorphic FK
│ amount               │
│ payment_method       │
│ transaction_ref      │
│ FK created_by        │
│ created_at           │
└──────────────────────┘
```

## Cardinality Summary

| Relationship                            | Type  |
|-----------------------------------------|-------|
| User → Audit Logs                       | 1 : N |
| Supplier → Purchase Orders              | 1 : N |
| Purchase Order → Purchase Items         | 1 : N |
| Medicine → Purchase Items               | 1 : N |
| Medicine → Sale Items                   | 1 : N |
| Medicine → Inventory Transactions       | 1 : N |
| Customer → Sales                        | 1 : N |
| Sale → Sale Items                       | 1 : N |
| Customer → Prescriptions                | 1 : N |
| Prescription → Sales (optional)         | 1 : N |
| Sale/Purchase → Payments (polymorphic)  | 1 : N |

## Indexes
Key indexes on:
- `medicines(barcode)`, `medicines(expiry_date)`, `medicines(stock_quantity, reorder_level)`
- `sales(created_at DESC)`, `sales(customer_id)`, `sales(invoice_number)`
- `purchase_orders(supplier_id)`, `purchase_orders(status)`
- `inventory_transactions(medicine_id, created_at DESC)`
- `audit_logs(action, created_at DESC)`, `audit_logs(user_id, created_at DESC)`
- `users(email, is_active)`, `users(role)`
