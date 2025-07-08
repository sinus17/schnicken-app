-- Add user_id column to spieler table
ALTER TABLE spieler ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create index on user_id column for faster lookups
CREATE INDEX IF NOT EXISTS idx_spieler_user_id ON spieler(user_id);

-- Comment on the column
COMMENT ON COLUMN spieler.user_id IS 'UUID of the authenticated user from auth.users';

-- Note: We can't set up a foreign key constraint to auth.users because we don't have permissions
-- to modify the auth schema in Supabase
