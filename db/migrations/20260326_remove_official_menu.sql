-- Remove is_official_menu column from products table
ALTER TABLE products
DROP COLUMN IF EXISTS is_official_menu;
