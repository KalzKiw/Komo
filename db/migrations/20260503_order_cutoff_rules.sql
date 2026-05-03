INSERT INTO settings (key, value) VALUES
  ('ORDER_CUTOFF_MORNING',   '09:00'),
  ('ORDER_CUTOFF_AFTERNOON', '15:00'),
  ('ORDER_CUTOFF_NIGHT',     '18:00'),
  ('ORDER_GRACE_MINUTES',    '0'),
  ('ORDER_CUTOFF_DISABLED',  'false')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();
