-- Grants SELECT on schnicks-related tables to authenticated and anon users.
-- Background: ohne diese Policies versteckt RLS alle Zeilen vor dem
-- Frontend (anon-Key + signed-in user). Nur das service_role konnte
-- bisher lesen, daher waren History/AllSchnicks immer leer.

-- 1) schnicks ----------------------------------------------------------------
ALTER TABLE schnicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read schnicks for everyone" ON schnicks;
CREATE POLICY "Allow read schnicks for everyone"
ON schnicks FOR SELECT
TO authenticated, anon
USING (true);

-- (Optional) erlaube authenticated Inserts/Updates – das macht die App
-- auch heute schon über den anon-Client.
DROP POLICY IF EXISTS "Allow insert schnicks for authenticated" ON schnicks;
CREATE POLICY "Allow insert schnicks for authenticated"
ON schnicks FOR INSERT
TO authenticated, anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update schnicks for authenticated" ON schnicks;
CREATE POLICY "Allow update schnicks for authenticated"
ON schnicks FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- 2) schnick_zahlen ----------------------------------------------------------
ALTER TABLE schnick_zahlen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read schnick_zahlen for everyone" ON schnick_zahlen;
CREATE POLICY "Allow read schnick_zahlen for everyone"
ON schnick_zahlen FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Allow insert schnick_zahlen for authenticated" ON schnick_zahlen;
CREATE POLICY "Allow insert schnick_zahlen for authenticated"
ON schnick_zahlen FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 3) spieler_schnicks --------------------------------------------------------
ALTER TABLE spieler_schnicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read spieler_schnicks for everyone" ON spieler_schnicks;
CREATE POLICY "Allow read spieler_schnicks for everyone"
ON spieler_schnicks FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Allow insert spieler_schnicks for authenticated" ON spieler_schnicks;
CREATE POLICY "Allow insert spieler_schnicks for authenticated"
ON spieler_schnicks FOR INSERT
TO authenticated, anon
WITH CHECK (true);
