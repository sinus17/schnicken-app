-- Erstelle die Spieler-Tabelle
CREATE TABLE IF NOT EXISTS spieler (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    avatar_url TEXT
);

-- Erstelle die Schnicks-Tabelle (Spiele)
CREATE TABLE IF NOT EXISTS schnicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    beendet BOOLEAN DEFAULT FALSE,
    gewinner_id UUID REFERENCES spieler(id)
);

-- Erstelle die Schnick-Zahlen-Tabelle (Spielzüge)
CREATE TABLE IF NOT EXISTS schnick_zahlen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schnick_id UUID REFERENCES schnicks(id) ON DELETE CASCADE,
    spieler_id UUID REFERENCES spieler(id) ON DELETE CASCADE,
    zahl SMALLINT NOT NULL CHECK (zahl >= 0 AND zahl <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Erstelle die Spieler-zu-Spiel Verbindungstabelle
CREATE TABLE IF NOT EXISTS spieler_schnicks (
    spieler_id UUID REFERENCES spieler(id) ON DELETE CASCADE,
    schnick_id UUID REFERENCES schnicks(id) ON DELETE CASCADE,
    PRIMARY KEY (spieler_id, schnick_id)
);

-- Füge einige Beispiel-Spieler hinzu
INSERT INTO spieler (name) VALUES
    ('Max'),
    ('Anna'),
    ('Leon'),
    ('Emma')
ON CONFLICT (id) DO NOTHING;

-- Aktiviere Erweiterungen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
