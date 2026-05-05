-- Keep add-ons as customizations, not standalone catalogue products.
BEGIN;

UPDATE products
SET is_active = false,
    updated_at = NOW()
WHERE product_info->>'categoria' = 'extra'
   OR product_info->>'id' IN (
     'suplemento-para-llevar',
     'ingrediente-extra-queso',
     'ingrediente-extra-tomate-lechuga',
     'salsa-mojo-alioli-mostaza'
   )
   OR lower(name) IN (
     'suplemento para llevar',
     'ingrediente extra queso',
     'ingrediente extra tomate y lechuga',
     'salsa mojo alioli mostaza'
   );

COMMIT;
