-- Migration: add linking_tokens table for family account linking
-- Tokens are short-lived (15 min) and single-use.

CREATE TABLE IF NOT EXISTS linking_tokens (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token_code   TEXT        NOT NULL UNIQUE,          -- e.g. "X7B-9PQ"
  parent_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used         BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by code
CREATE INDEX IF NOT EXISTS idx_linking_tokens_code ON linking_tokens(token_code);

-- family_links already exists in schema.sql but may be missing the status column
-- Add it idempotently
ALTER TABLE family_links
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'REVOKED'));
