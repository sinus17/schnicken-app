-- Erstellt einen neuen Spieler für jeden neuen Supabase-Benutzer
CREATE OR REPLACE FUNCTION public.create_spieler_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Füge einen neuen Spieler basierend auf dem neu erstellten Benutzer hinzu
  INSERT INTO public.spieler (id, name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lösche bestehende Trigger, falls vorhanden
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger, der die Funktion aufruft, wenn ein neuer Benutzer erstellt wird
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_spieler_for_new_user();

-- RLS-Richtlinien für spieler-Tabelle anpassen
ALTER TABLE public.spieler ENABLE ROW LEVEL SECURITY;

-- Policy: Spieler können von allen authentifizierten Benutzern gelesen werden
CREATE POLICY "Spieler sind für alle authentifizierten Benutzer sichtbar" 
ON public.spieler FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Benutzer können nur ihren eigenen Spieler aktualisieren
CREATE POLICY "Benutzer können nur ihren eigenen Spieler aktualisieren" 
ON public.spieler FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

-- Aktualisiere bestehende Spieler mit Benutzer-IDs, falls noch nicht geschehen
-- Dies verbindet vorhandene Spieler mit vorhandenen Benutzern basierend auf der E-Mail
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT * FROM auth.users
  LOOP
    -- Prüfen, ob bereits ein Spieler mit dieser ID existiert
    IF NOT EXISTS (SELECT 1 FROM public.spieler WHERE id = user_record.id) THEN
      INSERT INTO public.spieler (id, name, avatar_url)
      VALUES (
        user_record.id,
        COALESCE(user_record.raw_user_meta_data->>'name', user_record.email),
        user_record.raw_user_meta_data->>'avatar_url'
      );
    END IF;
  END LOOP;
END;
$$;
