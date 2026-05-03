-- Minimal seed for local testing of main app flows
-- Execute after schema.sql

BEGIN;

INSERT INTO courses (id, code, name)
VALUES
  ('11111111-1111-1111-1111-111111111111', '1ESO-A', '1 ESO A')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, full_name, role, course_id, is_beneficiary, wallet_balance)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'student1@cafes.app', 'Alumno Uno', 'STUDENT', '11111111-1111-1111-1111-111111111111', true, 5.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'student2@cafes.app', 'Alumno Dos', 'STUDENT', '11111111-1111-1111-1111-111111111111', false, 1.50),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'staff1@cafes.app', 'Cocina Staff', 'STAFF', NULL, false, 0.00),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'admin1@cafes.app', 'Admin Centro', 'ADMIN', NULL, false, 0.00),
  ('eeeeeeee-0000-0000-0000-000000000001', 'parent1@cafes.app', 'Carmen García', 'PARENT', NULL, false, 45.50)
ON CONFLICT (id) DO NOTHING;

INSERT INTO allergens (id, code, name)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'GLUTEN', 'Gluten'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'MILK', 'Leche'),
  ('11111111-1111-1111-1111-111111111111', 'EGGS', 'Huevos'),
  ('22222222-2222-2222-2222-222222222222', 'FISH', 'Pescado'),
  ('33333333-3333-3333-3333-333333333333', 'PEANUTS', 'Cacahuetes'),
  ('44444444-4444-4444-4444-444444444444', 'SOYBEANS', 'Soja'),
  ('55555555-5555-5555-5555-555555555555', 'TREE_NUTS', 'Frutos secos'),
  ('66666666-6666-6666-6666-666666666666', 'CELERY', 'Apio'),
  ('77777777-7777-7777-7777-777777777777', 'MUSTARD', 'Mostaza'),
  ('88888888-8888-8888-8888-888888888888', 'SESAME', 'Sésamo'),
  ('99999999-9999-9999-9999-999999999999', 'SULPHITES', 'Sulfitos'),
  ('aaaaaaaa-0000-0000-0000-000000000000', 'LUPINS', 'Altramuces'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'MOLLUSCS', 'Moluscos'),
  ('cccccccc-0000-0000-0000-000000000000', 'CRUSTACEANS', 'Crustáceos')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_allergies (user_id, allergen_id)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')
ON CONFLICT (user_id, allergen_id) DO NOTHING;

INSERT INTO family_links (id, parent_user_id, student_user_id, relation, status)
VALUES
  ('abababab-abab-abab-abab-abababababab', 'eeeeeeee-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PARENT', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';

INSERT INTO products (id, name, description, price, is_official_menu, is_active)
VALUES
  ('12121212-1212-1212-1212-121212121212', 'Bocadillo Oficial', 'Menu oficial escolar', 2.50, true, true),
  ('13131313-1313-1313-1313-131313131313', 'Zumo Naranja', 'Zumo natural 250ml', 1.20, false, true),
  ('14141414-1414-1414-1414-141414141414', 'Croissant', 'Croissant artesanal', 1.00, false, true),
  ('15151515-0000-0000-0000-000000000001', 'Sándwich de Jamón', 'Pan con jamón y queso', 2.00, false, true),
  ('15151515-0000-0000-0000-000000000002', 'Pasta con Cacahuete', 'Pasta con salsa de cacahuete', 3.50, false, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_allergens (product_id, allergen_id)
VALUES
  ('12121212-1212-1212-1212-121212121212', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('14141414-1414-1414-1414-141414141414', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('15151515-0000-0000-0000-000000000001', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  ('15151515-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (product_id, allergen_id) DO NOTHING;

INSERT INTO orders (
  id,
  user_id,
  placed_by_user_id,
  shift,
  scheduled_for,
  status,
  subtotal,
  total,
  cancellation_deadline,
  credited_to_wallet
)
VALUES
  (
    '15151515-1515-1515-1515-151515151515',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'MORNING',
    CURRENT_DATE,
    'PENDING',
    0.00,
    0.00,
    NOW() + INTERVAL '2 hours',
    false
  ),
  (
    '16161616-1616-1616-1616-161616161616',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'AFTERNOON',
    CURRENT_DATE,
    'IN_PREPARATION',
    2.20,
    2.20,
    NOW() + INTERVAL '3 hours',
    false
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, line_total)
VALUES
  ('17171717-1717-1717-1717-171717171717', '15151515-1515-1515-1515-151515151515', '12121212-1212-1212-1212-121212121212', 1, 0.00, 0.00),
  ('18181818-1818-1818-1818-181818181818', '16161616-1616-1616-1616-161616161616', '13131313-1313-1313-1313-131313131313', 1, 1.20, 1.20),
  ('19191919-1919-1919-1919-191919191919', '16161616-1616-1616-1616-161616161616', '14141414-1414-1414-1414-141414141414', 1, 1.00, 1.00)
ON CONFLICT (id) DO NOTHING;

COMMIT;
