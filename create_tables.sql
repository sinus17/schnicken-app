-- Überprüfen, ob die schnicks-Tabelle bereits existiert und gegebenenfalls löschen
DROP TABLE IF EXISTS schnick_zahlen;
DROP TABLE IF EXISTS schnicks;

-- Schnicks-Tabelle neu erstellen
CREATE TABLE schnicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    schnicker_id UUID NOT NULL REFERENCES spieler(id),
    angeschnickter_id UUID NOT NULL REFERENCES spieler(id),
    aufgabe TEXT NOT NULL,
    bock_wert INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'offen',
    ergebnis TEXT
);

-- Schnick_zahlen-Tabelle neu erstellen
CREATE TABLE schnick_zahlen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    schnick_id UUID NOT NULL REFERENCES schnicks(id),
    spieler_id UUID NOT NULL REFERENCES spieler(id),
    runde INTEGER NOT NULL,
    zahl INTEGER NOT NULL
);
