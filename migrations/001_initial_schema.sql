CREATE TABLE IF NOT EXISTS rooms (
  id text PRIMARY KEY,
  title text NOT NULL,
  join_code text NOT NULL UNIQUE,
  admin_token text NOT NULL UNIQUE,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS targets (
  id text PRIMARY KEY,
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name text NOT NULL,
  scanner_token text NOT NULL UNIQUE,
  fallback_code text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, fallback_code)
);

CREATE TABLE IF NOT EXISTS participants (
  id text PRIMARY KEY,
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  participant_token text NOT NULL UNIQUE,
  fallback_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, fallback_code)
);

CREATE TABLE IF NOT EXISTS claims (
  id text PRIMARY KEY,
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  target_id text NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  participant_id text NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_id, participant_id)
);

CREATE INDEX IF NOT EXISTS targets_room_id_idx ON targets(room_id);
CREATE INDEX IF NOT EXISTS participants_room_id_idx ON participants(room_id);
CREATE INDEX IF NOT EXISTS claims_room_id_idx ON claims(room_id);
CREATE INDEX IF NOT EXISTS claims_participant_id_idx ON claims(participant_id);
