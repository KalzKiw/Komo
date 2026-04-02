-- Tabla de configuración global de la aplicación (clave/valor)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Horarios de corte de pedidos por turno (formato HH:MM en hora local del centro)
INSERT INTO settings (key, value) VALUES
  ('ORDER_CUTOFF_MORNING',   '09:00'),
  ('ORDER_CUTOFF_AFTERNOON', '15:00'),
  ('ORDER_CUTOFF_NIGHT',     '18:00'),
  ('ORDER_GRACE_MINUTES',    '5')
ON CONFLICT (key) DO NOTHING;
