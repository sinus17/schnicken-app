-- Wir modifizieren die bestehende schnicks-Tabelle, anstatt sie zu löschen
ALTER TABLE schnicks 
  ADD COLUMN IF NOT EXISTS schnicker_id UUID REFERENCES spieler(id),
  ADD COLUMN IF NOT EXISTS angeschnickter_id UUID REFERENCES spieler(id),
  ADD COLUMN IF NOT EXISTS aufgabe TEXT,
  ADD COLUMN IF NOT EXISTS bock_wert INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offen',
  ADD COLUMN IF NOT EXISTS ergebnis TEXT;
