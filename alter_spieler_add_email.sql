-- Add email column to spieler table
ALTER TABLE spieler ADD COLUMN email text;

-- Create an index for faster lookups by email
CREATE INDEX idx_spieler_email ON spieler(email);
