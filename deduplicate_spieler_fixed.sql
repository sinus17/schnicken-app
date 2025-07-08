-- Fixed migration to clean up duplicate spieler records
-- This ensures each user_id has exactly one spieler record

-- First, identify duplicate user_id entries and keep the first one
WITH duplicate_users AS (
    SELECT user_id, 
           id,
           ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY id) as row_num
    FROM spieler
    WHERE user_id IS NOT NULL
)
-- Delete all but the first record for each user_id
DELETE FROM spieler
WHERE id IN (
    SELECT id
    FROM duplicate_users
    WHERE row_num > 1
);

-- Then handle duplicate email entries
WITH duplicate_emails AS (
    SELECT email, 
           id,
           ROW_NUMBER() OVER(PARTITION BY email ORDER BY id) as row_num
    FROM spieler
    WHERE email IS NOT NULL AND user_id IS NULL -- Only where user_id is null to avoid conflicts
)
-- Delete all but the first record for each email
DELETE FROM spieler
WHERE id IN (
    SELECT id
    FROM duplicate_emails
    WHERE row_num > 1
);

-- Add a unique constraint on user_id to prevent future duplicates
DO $$
BEGIN
  -- Check if the constraint already exists before adding it
  IF NOT EXISTS (
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_name = 'spieler' AND constraint_name = 'spieler_user_id_unique'
  ) THEN
    -- Add the constraint if it doesn't exist
    ALTER TABLE spieler
    ADD CONSTRAINT spieler_user_id_unique UNIQUE (user_id)
    DEFERRABLE INITIALLY DEFERRED;
  END IF;
END
$$;
