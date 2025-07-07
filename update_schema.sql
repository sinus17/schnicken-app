-- Überprüfen und Hinzufügen aller benötigten Spalten zur schnicks-Tabelle
DO $$
BEGIN
    -- Überprüfen und Hinzufügen von angeschnickter_id
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'schnicks'
        AND column_name = 'angeschnickter_id'
    ) THEN
        ALTER TABLE schnicks ADD COLUMN angeschnickter_id UUID REFERENCES spieler(id);
    END IF;

    -- Überprüfen und Hinzufügen von aufgabe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'schnicks'
        AND column_name = 'aufgabe'
    ) THEN
        ALTER TABLE schnicks ADD COLUMN aufgabe TEXT NOT NULL DEFAULT '';
    END IF;

    -- Überprüfen und Hinzufügen von bock_wert
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'schnicks'
        AND column_name = 'bock_wert'
    ) THEN
        ALTER TABLE schnicks ADD COLUMN bock_wert INTEGER NOT NULL DEFAULT 0;
    END IF;

    -- Überprüfen und Hinzufügen von status
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'schnicks'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE schnicks ADD COLUMN status TEXT NOT NULL DEFAULT 'offen';
    END IF;

    -- Überprüfen und Hinzufügen von ergebnis
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'schnicks'
        AND column_name = 'ergebnis'
    ) THEN
        ALTER TABLE schnicks ADD COLUMN ergebnis TEXT NULL;
    END IF;
END
$$;
