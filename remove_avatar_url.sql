-- Migration to remove avatar_url column from spieler table
-- Since we're removing the avatar feature from the application

ALTER TABLE spieler
DROP COLUMN IF EXISTS avatar_url;

-- Add a comment to the table
COMMENT ON TABLE spieler IS 'Player profiles without avatar support';
