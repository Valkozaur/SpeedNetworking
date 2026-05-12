ALTER TABLE rooms
  DROP COLUMN IF EXISTS background_image_url,
  DROP COLUMN IF EXISTS background_overlay;
