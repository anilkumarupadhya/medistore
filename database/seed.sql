-- =============================================================================
-- Seed Data — for development/demo only
-- Passwords are set via Django's seed_data management command (not here).
-- This file seeds reference/lookup data only.
-- =============================================================================

-- Sample suppliers
INSERT INTO suppliers (id, name, contact_person, mobile, email, address, city, state, pincode, gst_number, payment_terms)
VALUES
  (gen_random_uuid(), 'Sun Pharma Distributors',  'Rakesh Mehta',  '9800000001', 'rakesh@sunpharma.example',  '45 Industrial Area, Phase 1', 'Mumbai',    'Maharashtra', '400001', '27AABCS1429B1ZB', 30),
  (gen_random_uuid(), 'Cipla Wholesale',           'Anita Singh',   '9800000002', 'anita@cipla.example',       '12 MG Road',                  'Bengaluru',  'Karnataka',  '560001', '29AABCC4849B1ZK', 45),
  (gen_random_uuid(), 'Abbott Healthcare Ltd',     'Suresh Kumar',  '9800000003', 'suresh@abbott.example',     '7 Sector 18',                 'Noida',      'Uttar Pradesh','201301','09AAACC4875B1Z5', 30),
  (gen_random_uuid(), 'Mankind Pharma Depot',      'Preethi Nair',  '9800000004', 'preethi@mankind.example',   '88 Anna Salai',               'Chennai',    'Tamil Nadu',  '600002', '33AABCM3456C1ZM', 60),
  (gen_random_uuid(), 'Alkem Laboratories',        'Vikram Desai',  '9800000005', 'vikram@alkem.example',      '22 Linking Road',             'Mumbai',    'Maharashtra', '400050', '27AABCA2187G1ZP', 30)
ON CONFLICT DO NOTHING;

-- Sample customers
INSERT INTO customers (id, name, mobile, email, address)
VALUES
  (gen_random_uuid(), 'Rajesh Kumar',    '9700000001', 'rajesh@example.com',  '15 Park Street, Mumbai'),
  (gen_random_uuid(), 'Sunita Devi',     '9700000002', 'sunita@example.com',  '8 MG Road, Delhi'),
  (gen_random_uuid(), 'Arjun Patel',     '9700000003', 'arjun@example.com',   '23 Ring Road, Ahmedabad'),
  (gen_random_uuid(), 'Meena Iyer',      '9700000004', 'meena@example.com',   '5 Anna Nagar, Chennai'),
  (gen_random_uuid(), 'Kiran Sharma',    '9700000005', NULL,                  '11 Sector 22, Chandigarh'),
  (gen_random_uuid(), 'Walk-in Customer','9999999999', NULL,                  '')
ON CONFLICT DO NOTHING;

-- Sample medicines
INSERT INTO medicines (
    id, name, generic_name, brand_name, category, manufacturer,
    barcode, purchase_price, selling_price, mrp, gst_percentage,
    stock_quantity, reorder_level, unit, expiry_date, is_prescription
) VALUES
  (gen_random_uuid(), 'Paracetamol 500mg',         'Paracetamol',         'Crocin',         'TABLET',   'GSK',          '8901234560001', 12.00,  18.00,  20.00,  12.0, 500, 50, 'Strip',  '2026-12-31', FALSE),
  (gen_random_uuid(), 'Amoxicillin 250mg',          'Amoxicillin',         'Amoxil',         'CAPSULE',  'Cipla',        '8901234560002', 45.00,  65.00,  70.00,  12.0, 200, 30, 'Strip',  '2026-09-30', TRUE),
  (gen_random_uuid(), 'Cetirizine 10mg',            'Cetirizine HCl',      'Zyrtec',         'TABLET',   'UCB Pharma',   '8901234560003', 22.00,  32.00,  35.00,  12.0, 350, 40, 'Strip',  '2026-11-30', FALSE),
  (gen_random_uuid(), 'Omeprazole 20mg',            'Omeprazole',          'Omez',           'CAPSULE',  'Dr. Reddy''s', '8901234560004', 55.00,  78.00,  85.00,  12.0, 150, 25, 'Strip',  '2026-08-31', FALSE),
  (gen_random_uuid(), 'Metformin 500mg',            'Metformin HCl',       'Glucophage',     'TABLET',   'Merck',        '8901234560005', 30.00,  48.00,  55.00,  12.0,  80, 30, 'Strip',  '2026-10-31', TRUE),
  (gen_random_uuid(), 'Azithromycin 500mg',         'Azithromycin',        'Zithromax',      'TABLET',   'Pfizer',       '8901234560006', 90.00, 125.00, 135.00,  12.0, 120, 20, 'Strip',  '2026-07-31', TRUE),
  (gen_random_uuid(), 'Ibuprofen 400mg',            'Ibuprofen',           'Brufen',         'TABLET',   'Abbott',       '8901234560007', 18.00,  28.00,  32.00,  12.0, 400, 50, 'Strip',  '2027-01-31', FALSE),
  (gen_random_uuid(), 'Dextromethorphan Syrup',     'Dextromethorphan',    'Benadryl',       'SYRUP',    'J&J',          '8901234560008', 62.00,  88.00,  95.00,  12.0, 180, 30, 'Bottle', '2026-06-30', FALSE),
  (gen_random_uuid(), 'Insulin Glargine 100U/mL',   'Insulin Glargine',    'Lantus',         'INJECTION','Sanofi',       '8901234560009',680.00, 950.00,1000.00,   5.0,  45, 15, 'Vial',   '2026-04-30', TRUE),
  (gen_random_uuid(), 'Betamethasone Cream',        'Betamethasone',       'Betnovate',      'OINTMENT', 'GSK',          '8901234560010', 55.00,  85.00,  92.00,  12.0,  95, 20, 'Tube',   '2026-05-31', TRUE),
  -- Low-stock items (for alert testing)
  (gen_random_uuid(), 'Atorvastatin 10mg',          'Atorvastatin',        'Lipitor',        'TABLET',   'Pfizer',       '8901234560011',120.00, 170.00, 185.00,  12.0,   8, 20, 'Strip',  '2026-12-31', TRUE),
  (gen_random_uuid(), 'Losartan 50mg',              'Losartan Potassium',  'Cozaar',         'TABLET',   'MSD',          '8901234560012', 95.00, 135.00, 148.00,  12.0,   5, 25, 'Strip',  '2026-11-30', TRUE),
  -- Expiring soon item (for alert testing)
  (gen_random_uuid(), 'Pantoprazole 40mg',          'Pantoprazole Sodium', 'Pan-40',         'TABLET',   'Alkem',        '8901234560013', 48.00,  68.00,  75.00,  12.0, 240, 40, 'Strip',  CURRENT_DATE + INTERVAL '15 days', FALSE)
ON CONFLICT DO NOTHING;
