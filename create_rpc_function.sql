-- Function to get all schnicks with players in a single query
CREATE OR REPLACE FUNCTION get_all_schnicks_with_players()
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT 
    json_build_object(
      'id', s.id,
      'created_at', s.created_at,
      'aufgabe', s.aufgabe,
      'status', s.status,
      'ergebnis', s.ergebnis,
      'bock_wert', s.bock_wert,
      
      -- Schnicker details
      'schnicker_id', schnicker.id,
      'schnicker_name', schnicker.name,
      'schnicker_created_at', schnicker.created_at,
      
      -- Angeschnickter details
      'angeschnickter_id', angeschnickter.id,
      'angeschnickter_name', angeschnickter.name,
      'angeschnickter_created_at', angeschnickter.created_at,
      
      -- Round 1 numbers
      'runde1_zahlen', (
        SELECT json_agg(
          json_build_object(
            'id', z1.id,
            'schnick_id', z1.schnick_id,
            'spieler_id', z1.spieler_id,
            'runde', z1.runde,
            'zahl', z1.zahl,
            'created_at', z1.created_at
          )
        )
        FROM schnick_zahlen z1
        WHERE z1.schnick_id = s.id AND z1.runde = 1
      ),
      
      -- Round 2 numbers
      'runde2_zahlen', (
        SELECT json_agg(
          json_build_object(
            'id', z2.id,
            'schnick_id', z2.schnick_id,
            'spieler_id', z2.spieler_id,
            'runde', z2.runde,
            'zahl', z2.zahl,
            'created_at', z2.created_at
          )
        )
        FROM schnick_zahlen z2
        WHERE z2.schnick_id = s.id AND z2.runde = 2
      )
    )
  FROM 
    schnicks s
    -- Join to get the schnicker
    LEFT JOIN spieler_schnicks ps_schnicker ON s.id = ps_schnicker.schnick_id
    LEFT JOIN spieler schnicker ON ps_schnicker.spieler_id = schnicker.id
    
    -- Join to get the angeschnickter (with an offset of 1 in the array index)
    LEFT JOIN spieler_schnicks ps_angeschnickter ON s.id = ps_angeschnickter.schnick_id 
      AND ps_angeschnickter.spieler_id != schnicker.id
    LEFT JOIN spieler angeschnickter ON ps_angeschnickter.spieler_id = angeschnickter.id
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;
