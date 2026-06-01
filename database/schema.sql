-- =============================================================================
-- Medical Store Management System — PostgreSQL Schema
-- Version: 1.0.0
-- Description: Normalized schema for a full pharmacy management system.
--              All UUIDs, audit trails, soft deletes, and proper FK constraints.
-- =============================================================================

-- Enable the uuid-ossp extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'PHARMACIST', 'CASHIER', 'INVENTORY_MANAGER');
CREATE TYPE audit_action AS ENUM (
    'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE',
    'CREATE', 'UPDATE', 'DELETE', 'EXPORT'
);
CREATE TYPE medicine_category AS ENUM (
    'TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT',
    'DROPS', 'INHALER', 'POWDER', 'SUPPOSITORY', 'PATCH', 'OTHER'
);
CREATE TYPE inventory_tx_type AS ENUM (
    'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RETURN', 'EXPIRED', 'DAMAGED'
);
CREATE TYPE purchase_status AS ENUM (
    'DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'
);
CREATE TYPE sale_status AS ENUM ('COMPLETED', 'RETURNED', 'CANCELLED');
CREATE TYPE payment_method AS ENUM (
    'CASH', 'CARD', 'UPI', 'NETBANKING', 'CHEQUE', 'CREDIT'
);
CREATE TYPE payment_status AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- =============================================================================
-- TABLE: users
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(254) NOT NULL,
    first_name          VARCHAR(150) NOT NULL,
    last_name           VARCHAR(150) NOT NULL,
    phone               VARCHAR(20) NOT NULL DEFAULT '',
    password            VARCHAR(255) NOT NULL,       -- argon2 / bcrypt hash
    role                user_role NOT NULL DEFAULT 'PHARMACIST',
    avatar              VARCHAR(500),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_staff            BOOLEAN NOT NULL DEFAULT FALSE,
    is_superuser        BOOLEAN NOT NULL DEFAULT FALSE,
    last_login          TIMESTAMPTZ,
    last_login_ip       INET,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX idx_users_email_active ON users (email, is_active);
CREATE INDEX idx_users_role         ON users (role);

-- =============================================================================
-- TABLE: audit_logs
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID REFERENCES users (id) ON DELETE SET NULL,
    action      audit_action NOT NULL,
    resource    VARCHAR(100) NOT NULL DEFAULT '',
    resource_id VARCHAR(100) NOT NULL DEFAULT '',
    ip_address  INET,
    user_agent  TEXT NOT NULL DEFAULT '',
    extra_data  JSONB NOT NULL DEFAULT '{}',
    success     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_action_date ON audit_logs (action, created_at DESC);
CREATE INDEX idx_audit_user_date   ON audit_logs (user_id, created_at DESC);

-- =============================================================================
-- TABLE: suppliers
-- =============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    contact_person  VARCHAR(150) NOT NULL DEFAULT '',
    mobile          VARCHAR(20) NOT NULL,
    email           VARCHAR(254),
    address         TEXT NOT NULL DEFAULT '',
    city            VARCHAR(100) NOT NULL DEFAULT '',
    state           VARCHAR(100) NOT NULL DEFAULT '',
    pincode         VARCHAR(10) NOT NULL DEFAULT '',
    gst_number      VARCHAR(20),
    payment_terms   SMALLINT NOT NULL DEFAULT 30,   -- days
    opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    notes           TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_supplier_mobile UNIQUE (mobile)
);

CREATE INDEX idx_supplier_name     ON suppliers (name);
CREATE INDEX idx_supplier_active   ON suppliers (is_active);

-- =============================================================================
-- TABLE: customers
-- =============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    mobile          VARCHAR(20) NOT NULL,
    email           VARCHAR(254),
    address         TEXT NOT NULL DEFAULT '',
    date_of_birth   DATE,
    loyalty_points  INTEGER NOT NULL DEFAULT 0,
    opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    notes           TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_customer_mobile UNIQUE (mobile)
);

CREATE INDEX idx_customer_name     ON customers (name);
CREATE INDEX idx_customer_mobile   ON customers (mobile);

-- =============================================================================
-- TABLE: medicines
-- =============================================================================

CREATE TABLE IF NOT EXISTS medicines (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    generic_name        VARCHAR(255) NOT NULL DEFAULT '',
    brand_name          VARCHAR(255) NOT NULL DEFAULT '',
    category            medicine_category NOT NULL DEFAULT 'OTHER',
    manufacturer        VARCHAR(255) NOT NULL DEFAULT '',
    barcode             VARCHAR(100),
    batch_number        VARCHAR(100) NOT NULL DEFAULT '',
    purchase_price      NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    selling_price       NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    mrp                 NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    gst_percentage      NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    hsn_code            VARCHAR(20) NOT NULL DEFAULT '',
    stock_quantity      INTEGER NOT NULL DEFAULT 0,
    reorder_level       INTEGER NOT NULL DEFAULT 10,
    unit                VARCHAR(30) NOT NULL DEFAULT 'Strip',    -- Strip, Bottle, etc.
    manufacturing_date  DATE,
    expiry_date         DATE,
    is_prescription     BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    notes               TEXT NOT NULL DEFAULT '',
    created_by          UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_medicine_barcode UNIQUE (barcode),
    CONSTRAINT chk_selling_price   CHECK (selling_price >= 0),
    CONSTRAINT chk_purchase_price  CHECK (purchase_price >= 0),
    CONSTRAINT chk_stock           CHECK (stock_quantity >= 0)
);

CREATE INDEX idx_medicine_name        ON medicines (name);
CREATE INDEX idx_medicine_barcode     ON medicines (barcode);
CREATE INDEX idx_medicine_expiry      ON medicines (expiry_date);
CREATE INDEX idx_medicine_low_stock   ON medicines (stock_quantity, reorder_level);
CREATE INDEX idx_medicine_category    ON medicines (category);
CREATE INDEX idx_medicine_active      ON medicines (is_active);

-- =============================================================================
-- TABLE: inventory_transactions
-- =============================================================================

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id              BIGSERIAL PRIMARY KEY,
    medicine_id     UUID NOT NULL REFERENCES medicines (id) ON DELETE RESTRICT,
    tx_type         inventory_tx_type NOT NULL,
    quantity        INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after  INTEGER NOT NULL,
    batch_number    VARCHAR(100) NOT NULL DEFAULT '',
    expiry_date     DATE,
    purchase_price  NUMERIC(12,2),
    selling_price   NUMERIC(12,2),
    reference_type  VARCHAR(50) NOT NULL DEFAULT '',   -- 'PURCHASE', 'SALE', 'ADJUSTMENT'
    reference_id    UUID,
    reason          TEXT NOT NULL DEFAULT '',
    created_by      UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_inv_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_inv_medicine_date ON inventory_transactions (medicine_id, created_at DESC);
CREATE INDEX idx_inv_tx_type       ON inventory_transactions (tx_type);
CREATE INDEX idx_inv_reference     ON inventory_transactions (reference_type, reference_id);

-- =============================================================================
-- TABLE: purchase_orders
-- =============================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number       VARCHAR(50) NOT NULL,
    supplier_id     UUID NOT NULL REFERENCES suppliers (id) ON DELETE RESTRICT,
    status          purchase_status NOT NULL DEFAULT 'DRAFT',
    invoice_number  VARCHAR(100),
    invoice_date    DATE,
    subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    tax_amount      NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_amount    NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    amount_paid     NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    payment_status  payment_status NOT NULL DEFAULT 'PENDING',
    payment_method  payment_method,
    notes           TEXT NOT NULL DEFAULT '',
    received_at     TIMESTAMPTZ,
    created_by      UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_po_number UNIQUE (po_number)
);

CREATE INDEX idx_po_supplier    ON purchase_orders (supplier_id);
CREATE INDEX idx_po_status      ON purchase_orders (status);
CREATE INDEX idx_po_date        ON purchase_orders (created_at DESC);

-- =============================================================================
-- TABLE: purchase_items
-- =============================================================================

CREATE TABLE IF NOT EXISTS purchase_items (
    id              BIGSERIAL PRIMARY KEY,
    purchase_id     UUID NOT NULL REFERENCES purchase_orders (id) ON DELETE CASCADE,
    medicine_id     UUID NOT NULL REFERENCES medicines (id) ON DELETE RESTRICT,
    batch_number    VARCHAR(100) NOT NULL DEFAULT '',
    expiry_date     DATE,
    quantity        INTEGER NOT NULL,
    free_quantity   INTEGER NOT NULL DEFAULT 0,
    purchase_price  NUMERIC(12,2) NOT NULL,
    selling_price   NUMERIC(12,2) NOT NULL,
    mrp             NUMERIC(12,2) NOT NULL,
    discount_pct    NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    gst_percentage  NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    gst_amount      NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount    NUMERIC(14,2) NOT NULL,
    CONSTRAINT chk_pi_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_pi_purchase ON purchase_items (purchase_id);
CREATE INDEX idx_pi_medicine ON purchase_items (medicine_id);

-- =============================================================================
-- TABLE: prescriptions
-- =============================================================================

CREATE TABLE IF NOT EXISTS prescriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID REFERENCES customers (id) ON DELETE SET NULL,
    doctor_name     VARCHAR(255) NOT NULL DEFAULT '',
    doctor_reg_no   VARCHAR(100) NOT NULL DEFAULT '',
    file_url        VARCHAR(1000) NOT NULL,           -- S3 URL
    s3_key          VARCHAR(500) NOT NULL DEFAULT '',
    notes           TEXT NOT NULL DEFAULT '',
    uploaded_by     UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescription_customer ON prescriptions (customer_id);

-- =============================================================================
-- TABLE: sales
-- =============================================================================

CREATE TABLE IF NOT EXISTS sales (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number      VARCHAR(50) NOT NULL,
    customer_id         UUID REFERENCES customers (id) ON DELETE SET NULL,
    prescription_id     UUID REFERENCES prescriptions (id) ON DELETE SET NULL,
    status              sale_status NOT NULL DEFAULT 'COMPLETED',
    subtotal            NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    discount_amount     NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    tax_amount          NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_amount        NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    amount_paid         NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    change_amount       NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    payment_method      payment_method NOT NULL DEFAULT 'CASH',
    payment_status      payment_status NOT NULL DEFAULT 'PAID',
    loyalty_points_used INTEGER NOT NULL DEFAULT 0,
    loyalty_points_earned INTEGER NOT NULL DEFAULT 0,
    notes               TEXT NOT NULL DEFAULT '',
    created_by          UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_invoice_number UNIQUE (invoice_number)
);

CREATE INDEX idx_sale_customer   ON sales (customer_id);
CREATE INDEX idx_sale_date       ON sales (created_at DESC);
CREATE INDEX idx_sale_status     ON sales (status);
CREATE INDEX idx_sale_invoice    ON sales (invoice_number);

-- =============================================================================
-- TABLE: sale_items
-- =============================================================================

CREATE TABLE IF NOT EXISTS sale_items (
    id              BIGSERIAL PRIMARY KEY,
    sale_id         UUID NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
    medicine_id     UUID NOT NULL REFERENCES medicines (id) ON DELETE RESTRICT,
    batch_number    VARCHAR(100) NOT NULL DEFAULT '',
    expiry_date     DATE,
    quantity        INTEGER NOT NULL,
    unit_price      NUMERIC(12,2) NOT NULL,
    mrp             NUMERIC(12,2) NOT NULL,
    discount_pct    NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    gst_percentage  NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    gst_amount      NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount    NUMERIC(14,2) NOT NULL,
    CONSTRAINT chk_si_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_si_sale     ON sale_items (sale_id);
CREATE INDEX idx_si_medicine ON sale_items (medicine_id);

-- =============================================================================
-- TABLE: payments
-- Tracks individual payment transactions for both sales and purchases.
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_type  VARCHAR(20) NOT NULL,    -- 'SALE' | 'PURCHASE'
    reference_id    UUID NOT NULL,
    amount          NUMERIC(14,2) NOT NULL,
    payment_method  payment_method NOT NULL DEFAULT 'CASH',
    transaction_ref VARCHAR(255) NOT NULL DEFAULT '',  -- UPI/card txn ID
    notes           TEXT NOT NULL DEFAULT '',
    created_by      UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_reference ON payments (reference_type, reference_id);
CREATE INDEX idx_payment_date      ON payments (created_at DESC);

-- =============================================================================
-- TRIGGERS: updated_at auto-refresh
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['users','suppliers','customers','medicines','purchase_orders','sales']
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at
             BEFORE UPDATE ON %s
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
            t, t
        );
    END LOOP;
END;
$$;

-- =============================================================================
-- VIEWS (convenience)
-- =============================================================================

-- Low-stock medicines
CREATE OR REPLACE VIEW view_low_stock AS
SELECT
    id, name, generic_name, category, stock_quantity, reorder_level,
    (reorder_level - stock_quantity) AS units_below_reorder
FROM medicines
WHERE stock_quantity <= reorder_level
  AND is_active = TRUE
ORDER BY units_below_reorder DESC;

-- Medicines expiring within 30 days
CREATE OR REPLACE VIEW view_expiring_medicines AS
SELECT
    id, name, generic_name, batch_number,
    stock_quantity, expiry_date,
    (expiry_date - CURRENT_DATE) AS days_to_expiry
FROM medicines
WHERE expiry_date IS NOT NULL
  AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  AND expiry_date >= CURRENT_DATE
  AND is_active = TRUE
ORDER BY expiry_date ASC;

-- Daily sales summary
CREATE OR REPLACE VIEW view_daily_sales AS
SELECT
    DATE(created_at AT TIME ZONE 'UTC') AS sale_date,
    COUNT(*)                            AS total_invoices,
    SUM(total_amount)                   AS gross_sales,
    SUM(discount_amount)                AS total_discount,
    SUM(tax_amount)                     AS total_tax,
    SUM(total_amount - discount_amount) AS net_sales
FROM sales
WHERE status = 'COMPLETED'
GROUP BY DATE(created_at AT TIME ZONE 'UTC')
ORDER BY sale_date DESC;
