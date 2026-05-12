ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS target_id text REFERENCES targets(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS participants_target_id_unique_idx
  ON participants(target_id)
  WHERE target_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS category_claims (
  id text PRIMARY KEY,
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  category_id text NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  participant_id text NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  target_id text NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text NOT NULL DEFAULT '',
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS categories_room_id_idx ON categories(room_id);
CREATE INDEX IF NOT EXISTS category_claims_room_id_idx ON category_claims(room_id);
CREATE INDEX IF NOT EXISTS category_claims_participant_id_idx ON category_claims(participant_id);
CREATE INDEX IF NOT EXISTS category_claims_target_id_idx ON category_claims(target_id);
CREATE INDEX IF NOT EXISTS category_claims_category_id_idx ON category_claims(category_id);

CREATE UNIQUE INDEX IF NOT EXISTS category_claims_active_category_unique_idx
  ON category_claims(participant_id, category_id)
  WHERE status <> 'rejected';

CREATE UNIQUE INDEX IF NOT EXISTS category_claims_active_target_unique_idx
  ON category_claims(participant_id, target_id)
  WHERE status <> 'rejected';
