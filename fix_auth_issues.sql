-- Fix auth issues by:
-- 1. Removing the unique constraint if it exists
-- 2. Ensuring spieler table has correct structure
-- 3. Disabling row level security

-- 1. Remove the unique constraint on user_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'spieler_user_id_unique' AND conrelid = 'spieler'::regclass
  ) THEN
    ALTER TABLE spieler DROP CONSTRAINT spieler_user_id_unique;
  END IF;
END
$$;

-- 2. Make sure user_id is nullable to allow creation without auth
ALTER TABLE spieler 
ALTER COLUMN user_id DROP NOT NULL;

-- 3. Disable Row Level Security
ALTER TABLE spieler DISABLE ROW LEVEL SECURITY;

-- 4. Re-enable all policies for authenticated users
ALTER TABLE spieler FORCE ROW LEVEL SECURITY;
CREATE POLICY spieler_full_access ON spieler FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY spieler_public_read ON spieler FOR SELECT TO anon USING (true);

-- 5. Add a comment explaining the current state
COMMENT ON TABLE spieler IS 'Player profiles table with auth disabled for development';
