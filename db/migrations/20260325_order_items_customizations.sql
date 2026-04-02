ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS customization_json JSONB,
ADD COLUMN IF NOT EXISTS kitchen_note TEXT;
