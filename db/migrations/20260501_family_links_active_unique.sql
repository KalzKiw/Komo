-- Allow revoked family links to be created again later while keeping only one active link.

ALTER TABLE family_links
  DROP CONSTRAINT IF EXISTS uq_family_link;

CREATE UNIQUE INDEX IF NOT EXISTS uq_family_link_active
  ON family_links (parent_user_id, student_user_id, relation)
  WHERE status = 'ACTIVE';
