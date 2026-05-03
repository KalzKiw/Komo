-- Real school cafeteria menu with prices, allergens and product-info payloads.
BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS product_info JSONB;

CREATE TEMP TABLE real_menu_products ON COMMIT DROP AS
WITH source_products(
  slug, name, categoria, description, price, image_url, ingredientes, alergenos, trazas,
  kcal, grasas, hidratos, azucares, proteinas, sal
) AS (
  VALUES
    ('cafe-solo', 'Cafe Solo', 'bebida-caliente', 'Bebida caliente', 0.80, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', ARRAY['cafe','agua'], ARRAY[]::text[], ARRAY['leche'], 2, 0, 0.2, 0, 0.1, 0),
    ('cafe-con-leche', 'Cafe con Leche', 'bebida-caliente', 'Bebida caliente con leche', 1.00, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80', ARRAY['cafe','leche'], ARRAY['leche'], ARRAY[]::text[], 64, 2.2, 6.1, 6.1, 3.4, 0.11),
    ('cafe-leche-y-leche', 'Cafe Leche y Leche', 'bebida-caliente', 'Bebida caliente con leche y leche condensada', 1.20, 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=800&q=80', ARRAY['cafe','leche','leche condensada'], ARRAY['leche'], ARRAY[]::text[], 118, 2.5, 19.8, 19.6, 4.1, 0.15),
    ('cafe-cortado', 'Cafe Cortado', 'bebida-caliente', 'Cafe cortado con leche', 0.90, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', ARRAY['cafe','leche'], ARRAY['leche'], ARRAY[]::text[], 32, 1.1, 3.1, 3.1, 1.7, 0.06),
    ('cafe-cortado-leche-condensada', 'Cafe Cortado Leche Condensada', 'bebida-caliente', 'Cafe cortado con leche condensada', 0.90, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', ARRAY['cafe','leche condensada'], ARRAY['leche'], ARRAY[]::text[], 86, 1.5, 15.4, 15.2, 2.6, 0.09),
    ('cafe-cortado-leche-y-leche', 'Cafe Cortado Leche y Leche', 'bebida-caliente', 'Cafe cortado con leche y leche condensada', 1.00, 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80', ARRAY['cafe','leche','leche condensada'], ARRAY['leche'], ARRAY[]::text[], 96, 1.8, 16.8, 16.6, 3.1, 0.10),
    ('cacao', 'Cacao', 'bebida-caliente', 'Bebida caliente de cacao', 1.10, 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=800&q=80', ARRAY['leche','cacao soluble'], ARRAY['leche','soja'], ARRAY[]::text[], 145, 3.2, 22.5, 21.4, 6.2, 0.18),
    ('descafeinado-cafe-con-leche', 'Descafeinado Cafe con Leche', 'bebida-caliente', 'Cafe descafeinado con leche', 1.00, 'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?auto=format&fit=crop&w=800&q=80', ARRAY['cafe descafeinado','leche'], ARRAY['leche'], ARRAY[]::text[], 64, 2.2, 6.1, 6.1, 3.4, 0.11),
    ('descafeinado-cortado', 'Descafeinado Cortado', 'bebida-caliente', 'Cafe descafeinado cortado', 0.90, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', ARRAY['cafe descafeinado','leche'], ARRAY['leche'], ARRAY[]::text[], 32, 1.1, 3.1, 3.1, 1.7, 0.06),
    ('descafeinado-leche-y-leche', 'Descafeinado Leche y Leche', 'bebida-caliente', 'Cafe descafeinado con leche y leche condensada', 1.20, 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=800&q=80', ARRAY['cafe descafeinado','leche','leche condensada'], ARRAY['leche'], ARRAY[]::text[], 118, 2.5, 19.8, 19.6, 4.1, 0.15),
    ('infusion', 'Infusion', 'bebida-caliente', 'Infusion caliente', 0.80, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80', ARRAY['infusion','agua'], ARRAY[]::text[], ARRAY[]::text[], 2, 0, 0.1, 0, 0, 0),
    ('suplemento-para-llevar', 'Suplemento para llevar', 'extra', 'Suplemento de envase para llevar', 0.10, 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80', ARRAY['vaso o envase para llevar'], ARRAY[]::text[], ARRAY[]::text[], 0, 0, 0, 0, 0, 0),
    ('zumo-20cl', 'Zumo 20cl', 'bebida-fria', 'Zumo 20cl', 0.80, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80', ARRAY['zumo de fruta'], ARRAY[]::text[], ARRAY[]::text[], 90, 0.2, 20.5, 18.4, 0.8, 0.02),
    ('zumo-33cl', 'Zumo 33cl', 'bebida-fria', 'Zumo 33cl', 1.20, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80', ARRAY['zumo de fruta'], ARRAY[]::text[], ARRAY[]::text[], 148, 0.3, 33.8, 30.4, 1.3, 0.03),
    ('botella-agua-05l', 'Botella de Agua 0,5L', 'bebida-fria', 'Agua mineral 0,5L', 0.70, 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=800&q=80', ARRAY['agua'], ARRAY[]::text[], ARRAY[]::text[], 0, 0, 0, 0, 0, 0),
    ('botella-agua-gas', 'Botella de Agua Gas', 'bebida-fria', 'Agua con gas', 0.90, 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=80', ARRAY['agua carbonatada'], ARRAY[]::text[], ARRAY[]::text[], 0, 0, 0, 0, 0, 0),
    ('refrescos-sabores-zero', 'Refrescos Sabores / Zero', 'bebida-fria', 'Refrescos de sabores o zero', 1.60, 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=800&q=80', ARRAY['refresco'], ARRAY[]::text[], ARRAY[]::text[], 70, 0, 17, 16.5, 0, 0.02),
    ('galletas', 'Galletas', 'golosina', 'Galletas', 1.00, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80', ARRAY['galletas con harina de trigo, leche y soja'], ARRAY['gluten','leche','soja'], ARRAY['huevo','frutos de cascara'], 170, 6.4, 25.5, 10.2, 2.6, 0.28),
    ('bizcocho', 'Bizcocho', 'golosina', 'Bizcocho', 1.20, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', ARRAY['bizcocho con harina de trigo, huevo, leche y azucar'], ARRAY['gluten','huevo','leche'], ARRAY['soja','frutos de cascara'], 245, 9.8, 34.5, 18.8, 5.2, 0.36),
    ('donuts', 'Donuts', 'golosina', 'Donuts', 0.80, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', ARRAY['donut con harina de trigo, huevo, leche y soja'], ARRAY['gluten','huevo','leche','soja'], ARRAY['frutos de cascara'], 220, 11.2, 27.4, 12.6, 3.8, 0.35),
    ('barritas', 'Barritas', 'golosina', 'Barritas de cereales', 1.00, 'https://images.unsplash.com/photo-1622484211148-7a006b38c801?auto=format&fit=crop&w=800&q=80', ARRAY['barrita de cereales'], ARRAY['gluten','leche','soja','frutos de cascara'], ARRAY['cacahuetes'], 135, 4.2, 20.5, 8.6, 3.1, 0.16),
    ('tortitas', 'Tortitas', 'golosina', 'Tortitas', 1.20, 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=800&q=80', ARRAY['tortita de cereales'], ARRAY[]::text[], ARRAY['gluten','leche','soja','sesamo'], 115, 1.6, 23.4, 1.3, 2.2, 0.22),
    ('caramelos', 'Caramelos', 'golosina', 'Caramelos', 0.10, 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=800&q=80', ARRAY['caramelo'], ARRAY[]::text[], ARRAY['sulfitos'], 22, 0, 5.5, 4.8, 0, 0),
    ('bocadillo-embutido-pequeno', 'Bocadillo con Embutido Pequeno', 'bocadillo', 'Bocadillo pequeno con embutido', 1.50, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80', ARRAY['pan blanco','embutido variado'], ARRAY['gluten','soja','leche'], ARRAY['frutos de cascara'], 238, 3.4, 42.8, 3.9, 8.9, 0.98),
    ('bocadillo-embutido-grande', 'Bocadillo con Embutido Grande', 'bocadillo', 'Bocadillo grande con embutido', 1.80, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80', ARRAY['pan blanco','embutido variado'], ARRAY['gluten','soja','leche'], ARRAY['frutos de cascara'], 318, 4.6, 57.1, 5.2, 11.9, 1.31),
    ('bocadillo-embutido-extra-pequeno', 'Bocadillo con Embutido Extra Pequeno', 'bocadillo', 'Bocadillo pequeno con extra de embutido', 1.80, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80', ARRAY['pan blanco','embutido variado','extra de embutido'], ARRAY['gluten','soja','leche'], ARRAY['frutos de cascara'], 285, 5.1, 43.5, 3.9, 14.5, 1.35),
    ('bocadillo-embutido-extra-grande', 'Bocadillo con Embutido Extra Grande', 'bocadillo', 'Bocadillo grande con extra de embutido', 2.20, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80', ARRAY['pan blanco','embutido variado','extra de embutido'], ARRAY['gluten','soja','leche'], ARRAY['frutos de cascara'], 365, 6.4, 58, 5.2, 17.5, 1.75),
    ('bocadillo-jamon-serrano-pequeno', 'Bocadillo Jamon Serrano Pequeno', 'bocadillo', 'Bocadillo pequeno de jamon serrano', 1.50, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80', ARRAY['pan blanco','jamon serrano'], ARRAY['gluten'], ARRAY[]::text[], 263, 5, 40.5, 3.6, 13.3, 1.26),
    ('bocadillo-jamon-serrano-grande', 'Bocadillo Jamon Serrano Grande', 'bocadillo', 'Bocadillo grande de jamon serrano', 2.20, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80', ARRAY['pan blanco','jamon serrano'], ARRAY['gluten'], ARRAY[]::text[], 351, 6.7, 54, 4.7, 17.7, 1.68),
    ('bocadillo-tortilla-papas-pequeno', 'Bocadillo Tortilla de Papas Pequeno', 'bocadillo', 'Bocadillo pequeno de tortilla de papas', 2.00, 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80', ARRAY['pan blanco','tortilla de papas'], ARRAY['gluten','huevo'], ARRAY[]::text[], 239, 4, 42.3, 3.9, 7.4, 0.6),
    ('bocadillo-tortilla-papas-grande', 'Bocadillo Tortilla de Papas Grande', 'bocadillo', 'Bocadillo grande de tortilla de papas', 2.50, 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80', ARRAY['pan blanco','tortilla de papas'], ARRAY['gluten','huevo'], ARRAY[]::text[], 318, 5.3, 56.4, 5.2, 9.9, 0.8),
    ('bocadillo-lomo-o-pechuga-pequeno', 'Bocadillo de Lomo o Pechuga Pequeno', 'bocadillo', 'Bocadillo pequeno de lomo o pechuga', 2.20, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80', ARRAY['pan blanco','lomo adobado o pechuga de pollo'], ARRAY['gluten','soja'], ARRAY['leche'], 236, 3.2, 41.2, 3.7, 9.6, 0.95),
    ('bocadillo-lomo-o-pechuga-grande', 'Bocadillo de Lomo o Pechuga Grande', 'bocadillo', 'Bocadillo grande de lomo o pechuga', 2.80, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80', ARRAY['pan blanco','lomo adobado o pechuga de pollo'], ARRAY['gluten','soja'], ARRAY['leche'], 315, 4.3, 55, 4.9, 12.8, 1.27),
    ('bocadillo-vegetal-atun-pequeno', 'Bocadillo de Vegetal Atun Pequeno', 'bocadillo', 'Bocadillo pequeno vegetal de atun', 1.40, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80', ARRAY['pan blanco','atun','maiz','mayonesa','tomate','lechuga'], ARRAY['gluten','pescado','soja','huevo'], ARRAY[]::text[], 275, 6.7, 44.5, 4.2, 7.9, 1.04),
    ('bocadillo-vegetal-atun-grande', 'Bocadillo de Vegetal Atun Grande', 'bocadillo', 'Bocadillo grande vegetal de atun', 1.50, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80', ARRAY['pan blanco','atun','maiz','mayonesa','tomate','lechuga'], ARRAY['gluten','pescado','soja','huevo'], ARRAY[]::text[], 367, 8.9, 59.3, 5.6, 10.5, 1.39),
    ('ingrediente-extra-queso', 'Ingrediente Extra queso', 'extra', 'Extra de queso', 0.30, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=800&q=80', ARRAY['queso'], ARRAY['leche'], ARRAY[]::text[], 54, 4.2, 0.2, 0.2, 3.8, 0.22),
    ('ingrediente-extra-tomate-lechuga', 'Ingrediente Extra Tomate y lechuga', 'extra', 'Extra de tomate y lechuga', 0.30, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', ARRAY['tomate','lechuga'], ARRAY[]::text[], ARRAY[]::text[], 8, 0.1, 1.5, 1.2, 0.4, 0.01),
    ('salsa-mojo-alioli-mostaza', 'Salsa Mojo Alioli Mostaza', 'extra', 'Salsa mojo, alioli o mostaza', 0.20, 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=800&q=80', ARRAY['mojo','alioli','mostaza'], ARRAY['huevo','mostaza'], ARRAY['sulfitos'], 48, 4.9, 0.6, 0.3, 0.2, 0.18),
    ('pulguita-pan-integral', 'Pulguita Pan Integral', 'bocadillo', 'Pulguita de pan integral', 1.50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', ARRAY['pan integral'], ARRAY['gluten'], ARRAY['sesamo','soja'], 210, 2.9, 39.5, 3.2, 7.1, 0.72),
    ('sandwich-mixto', 'Sandwich Mixto', 'sandwich', 'Sandwich mixto', 1.80, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', ARRAY['pan de molde','fiambre','queso'], ARRAY['gluten','soja','leche'], ARRAY[]::text[], 279, 11.34, 31.8, 3.53, 12.3, 1.91),
    ('sandwich-vegetal-atun', 'Sandwich Vegetal Atun', 'sandwich', 'Sandwich vegetal con atun', 2.50, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', ARRAY['pan de molde','atun','maiz','mayonesa','tomate','lechuga'], ARRAY['gluten','pescado','soja','huevo'], ARRAY[]::text[], 197, 15.5, 18.5, 2.65, 12, 0.85),
    ('croissant', 'Croissant', 'croissant', 'Croissant', 1.20, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', ARRAY['croissant'], ARRAY['gluten','soja'], ARRAY['leche','huevo'], 295, 17.5, 29, 7.2, 5.8, 0.75),
    ('croissant-mixto', 'Croissant Mixto', 'croissant', 'Croissant mixto', 2.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', ARRAY['croissant','fiambre','queso'], ARRAY['gluten','soja','leche'], ARRAY[]::text[], 375, 22.9, 27.4, 2.1, 10, 1.6)
)
SELECT
  slug,
  name,
  categoria,
  description,
  price::numeric(10,2) AS price,
  image_url,
  jsonb_build_object(
    'id', slug,
    'nombre', name,
    'categoria', categoria,
    'ingredientes', to_jsonb(ingredientes),
    'alergenos', to_jsonb(alergenos),
    'trazas', to_jsonb(trazas),
    'informacionNutricional', jsonb_build_object(
      'kcal', kcal,
      'grasas', grasas,
      'hidratos', hidratos,
      'azucares', azucares,
      'proteinas', proteinas,
      'sal', sal
    ),
    'conservacion', CASE
      WHEN categoria LIKE 'bebida-caliente' THEN 'consumo inmediato; servir caliente'
      WHEN categoria IN ('bebida-fria', 'golosina') THEN 'conservar en lugar fresco y seco'
      WHEN categoria = 'extra' THEN 'consumir en el momento de servicio'
      ELSE 'consumo inmediato; refrigeracion entre 0 y 4 oC'
    END,
    'caducidad', CASE
      WHEN categoria IN ('bebida-fria', 'golosina') THEN 'segun fecha indicada en envase'
      ELSE 'consumir en el momento de servicio'
    END,
    'fuente', '[]'::jsonb
  ) AS product_info,
  alergenos,
  trazas
FROM source_products;

WITH inserted AS (
  INSERT INTO products (name, description, price, image_url, product_info, is_active)
  SELECT name, description, price, image_url, product_info, true
  FROM real_menu_products source
  WHERE NOT EXISTS (
    SELECT 1 FROM products p
    WHERE p.product_info->>'id' = source.slug OR lower(p.name) = lower(source.name)
  )
  RETURNING id
)
SELECT COUNT(*) FROM inserted;

UPDATE products p
SET
  name = source.name,
  description = source.description,
  price = source.price,
  image_url = source.image_url,
  product_info = source.product_info,
  is_active = true,
  updated_at = NOW()
FROM real_menu_products source
WHERE p.product_info->>'id' = source.slug OR lower(p.name) = lower(source.name);

UPDATE products
SET is_active = false, updated_at = NOW()
WHERE (
  product_info ? 'id'
  AND product_info->>'id' NOT IN (SELECT slug FROM real_menu_products)
) OR lower(name) IN (
  'bocadillo oficial',
  'zumo naranja',
  'pasta con cacahuete'
);

DELETE FROM product_allergens pa
USING products p, real_menu_products source
WHERE pa.product_id = p.id
  AND (p.product_info->>'id' = source.slug OR lower(p.name) = lower(source.name));

WITH allergen_codes(label, code) AS (
  VALUES
    ('gluten', 'GLUTEN'),
    ('crustaceos', 'CRUSTACEANS'),
    ('huevo', 'EGGS'),
    ('pescado', 'FISH'),
    ('cacahuetes', 'PEANUTS'),
    ('soja', 'SOYBEANS'),
    ('leche', 'MILK'),
    ('frutos de cascara', 'TREE_NUTS'),
    ('apio', 'CELERY'),
    ('mostaza', 'MUSTARD'),
    ('sesamo', 'SESAME'),
    ('sulfitos', 'SULPHITES'),
    ('altramuces', 'LUPINS'),
    ('moluscos', 'MOLLUSCS')
), menu_allergens AS (
  SELECT source.slug, unnest(source.alergenos || source.trazas) AS label
  FROM real_menu_products source
), matched_products AS (
  SELECT p.id, source.slug
  FROM products p
  JOIN real_menu_products source ON p.product_info->>'id' = source.slug OR lower(p.name) = lower(source.name)
)
INSERT INTO product_allergens (product_id, allergen_id)
SELECT DISTINCT mp.id, a.id
FROM menu_allergens ma
JOIN allergen_codes ac ON ac.label = ma.label
JOIN matched_products mp ON mp.slug = ma.slug
JOIN allergens a ON a.code = ac.code
ON CONFLICT (product_id, allergen_id) DO NOTHING;

COMMIT;
