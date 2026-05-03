CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF', 'STUDENT', 'DELEGATE', 'PARENT');
CREATE TYPE family_relation AS ENUM ('PARENT', 'DELEGATE');
CREATE TYPE order_shift AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');
CREATE TYPE order_status AS ENUM ('PENDING', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED');

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  is_beneficiary BOOLEAN NOT NULL DEFAULT FALSE,
  wallet_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (wallet_balance >= 0),
  phone TEXT,
  payment_card_last4 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE family_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relation family_relation NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_family_link UNIQUE (parent_user_id, student_user_id, relation),
  CONSTRAINT ck_family_not_self CHECK (parent_user_id <> student_user_id)
);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  concept TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  product_info JSONB,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  is_official_menu BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE product_allergens (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, allergen_id)
);

CREATE TABLE user_allergies (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, allergen_id)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  placed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  shift order_shift NOT NULL,
  scheduled_for DATE NOT NULL,
  status order_status NOT NULL DEFAULT 'PENDING',
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  cancellation_deadline TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  credited_to_wallet BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(10,2) NOT NULL CHECK (line_total >= 0),
  customization_json JSONB,
  kitchen_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_course_id ON users(course_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_shift_scheduled_for ON orders(shift, scheduled_for);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION cancel_order_atomic(
  p_order_id UUID,
  p_actor_user_id UUID,
  p_actor_role user_role
)
RETURNS TABLE(order_id UUID, status order_status, credited_to_wallet BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_should_credit BOOLEAN := FALSE;
BEGIN
  SELECT *
    INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF p_actor_role NOT IN ('ADMIN', 'STAFF') AND v_order.user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF v_order.status = 'CANCELLED' THEN
    RAISE EXCEPTION 'ALREADY_CANCELLED';
  END IF;

  IF v_order.status IN ('READY', 'DELIVERED') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;

  v_should_credit := NOW() <= v_order.cancellation_deadline
    AND v_order.total > 0
    AND NOT v_order.credited_to_wallet;

  UPDATE orders
  SET
    status = 'CANCELLED',
    cancelled_at = NOW(),
    credited_to_wallet = v_should_credit
  WHERE id = p_order_id;

  IF v_should_credit THEN
    UPDATE users
    SET wallet_balance = ROUND((wallet_balance + v_order.total)::numeric, 2)
    WHERE id = v_order.user_id;
  END IF;

  RETURN QUERY
  SELECT v_order.id, 'CANCELLED'::order_status, v_should_credit;
END;
$$;
