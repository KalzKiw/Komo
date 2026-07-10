ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS ticket_printed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ticket_print_error TEXT,
  ADD COLUMN IF NOT EXISTS ticket_print_attempts INTEGER NOT NULL DEFAULT 0 CHECK (ticket_print_attempts >= 0),
  ADD COLUMN IF NOT EXISTS ticket_print_last_attempt_at TIMESTAMPTZ;

UPDATE orders
SET
  ticket_printed_at = NOW(),
  ticket_print_error = COALESCE(ticket_print_error, 'Marcado como impreso al activar la cola para evitar reimpresion historica')
WHERE ticket_printed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_ticket_print_pending
  ON orders (created_at)
  WHERE ticket_printed_at IS NULL AND status <> 'CANCELLED';
