-- First, make sure RLS is enabled for the spieler table
ALTER TABLE spieler ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read all spieler records (needed for player selection screens)
CREATE POLICY "Allow public read access to all spieler records" 
ON spieler FOR SELECT 
USING (true);

-- Create policy to allow service role to perform all operations
CREATE POLICY "Allow service role full access to spieler table"
ON spieler FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create policy to allow authenticated users to update only their own records
CREATE POLICY "Allow users to update their own spieler record"
ON spieler FOR UPDATE
USING (auth.uid()::text = email);

-- Note: The INSERT operation will primarily be handled by the service role key in the application code
