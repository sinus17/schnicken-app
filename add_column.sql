-- Überprüfen, ob die Spalte bereits existiert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'schnicks'
        AND column_name = 'angeschnickter_id'
    ) THEN
        -- Spalte hinzufügen
        ALTER TABLE schnicks ADD COLUMN angeschnickter_id UUID REFERENCES spieler(id);
    END IF;
END
$$;
