-- Fix falsche Ergebnisse in der schnicks Tabelle
-- Regel: Gleiche Zahlen in Runde 1 = Angeschnickter verliert (Schnicker gewinnt)
-- Regel: Gleiche Zahlen in Runde 2 = Schnicker macht Eigentor (Angeschnickter gewinnt)

-- Korrigiere Spiele mit falschen ergebnis Werten
UPDATE schnicks 
SET ergebnis = 'schnicker' 
WHERE ergebnis = 'schnicker_won';

UPDATE schnicks 
SET ergebnis = 'angeschnickter' 
WHERE ergebnis = 'angeschnickter_won';

-- Finde und korrigiere Spiele mit gleichen Runde 1 Zahlen (falls als unentschieden gewertet)
-- Dies ist komplexer, da wir die Zahlen vergleichen müssen
WITH runde1_results AS (
  SELECT 
    s.id,
    s.ergebnis,
    sz1.zahl as zahl1,
    sz2.zahl as zahl2
  FROM schnicks s
  JOIN (
    SELECT schnick_id, zahl, ROW_NUMBER() OVER (PARTITION BY schnick_id ORDER BY created_at) as rn
    FROM schnick_zahlen sz
    JOIN schnicks s ON sz.schnick_id = s.id
    WHERE s.status = 'beendet'
  ) sz1 ON s.id = sz1.schnick_id AND sz1.rn = 1
  JOIN (
    SELECT schnick_id, zahl, ROW_NUMBER() OVER (PARTITION BY schnick_id ORDER BY created_at) as rn
    FROM schnick_zahlen sz
    JOIN schnicks s ON sz.schnick_id = s.id
    WHERE s.status = 'beendet'
  ) sz2 ON s.id = sz2.schnick_id AND sz2.rn = 2
  WHERE s.status = 'beendet'
    AND sz1.zahl = sz2.zahl
    AND s.ergebnis = 'unentschieden'
)
UPDATE schnicks 
SET ergebnis = CASE 
  WHEN (SELECT COUNT(*) FROM schnick_zahlen WHERE schnick_id = schnicks.id) = 2 THEN 'schnicker'  -- Runde 1 Gleichstand
  ELSE 'angeschnickter'  -- Runde 2 Gleichstand (Eigentor)
END
WHERE id IN (SELECT id FROM runde1_results);

-- Zeige Statistik der Änderungen
SELECT 
  ergebnis,
  COUNT(*) as anzahl
FROM schnicks 
WHERE status = 'beendet'
GROUP BY ergebnis;
