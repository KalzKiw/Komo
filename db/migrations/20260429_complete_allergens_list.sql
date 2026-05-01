-- Add complete EU 14 allergens list
-- Replaces the minimal allergen list with comprehensive entries

BEGIN;

-- First, delete previous allergen codes so the complete set can be replaced cleanly
DELETE FROM allergens WHERE code IN (
  'GLUTEN', 'LACTOSE', 'NUTS', 'EGGS', 'FISH', 'SHELLFISH', 'SOY', 
  'SESAME', 'MUSTARD', 'CELERY', 'LUPINS', 'MOLLUSCS', 'SULPHITES', 'PEANUTS',
  'TREE_NUTS', 'MILK', 'SOYBEANS', 'CRUSTACEANS'
);

-- Insert complete EU 14 allergens list with normalized codes
INSERT INTO allergens (code, name) VALUES
  ('GLUTEN', 'Gluten'),
  ('CRUSTACEANS', 'Crustáceos'),
  ('EGGS', 'Huevos'),
  ('FISH', 'Pescado'),
  ('PEANUTS', 'Cacahuetes'),
  ('SOYBEANS', 'Soja'),
  ('MILK', 'Leche'),
  ('TREE_NUTS', 'Frutos secos'),
  ('CELERY', 'Apio'),
  ('MUSTARD', 'Mostaza'),
  ('SESAME', 'Sésamo'),
  ('SULPHITES', 'Sulfitos'),
  ('LUPINS', 'Altramuces'),
  ('MOLLUSCS', 'Moluscos')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

COMMIT;
