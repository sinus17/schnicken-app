-- Migration to clean up duplicate spieler records
-- This ensures each user_id has exactly one spieler record

-- First, create a temporary table to identify duplicate user_id entries
CREATE TEMP TABLE duplicate_users AS
SELECT user_id, MIN(id) as keep_id
FROM spieler
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Output which records will be removed (for logging)
SELECT s.id, s.name, s.email, s.user_id, du.keep_id
FROM spieler s
JOIN duplicate_users du ON s.user_id = du.user_id
WHERE s.id != du.keep_id;

-- Delete duplicate records, keeping only the oldest one for each user_id
DELETE FROM spieler
WHERE id IN (
    SELECT s.id
    FROM spieler s
    JOIN duplicate_users du ON s.user_id = du.user_id
    WHERE s.id != du.keep_id
);

-- Also clean up duplicate email entries (where user_id might be NULL)
CREATE TEMP TABLE duplicate_emails AS
SELECT email, MIN(id) as keep_id
FROM spieler
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Delete duplicate records by email, keeping only the oldest one
DELETE FROM spieler
WHERE id IN (
    SELECT s.id
    FROM spieler s
    JOIN duplicate_emails de ON s.email = de.email
    WHERE s.id != de.keep_id
);

-- Add a unique constraint on user_id to prevent future duplicates
ALTER TABLE spieler
ADD CONSTRAINT spieler_user_id_unique UNIQUE (user_id)
DEFERRABLE INITIALLY DEFERRED;
