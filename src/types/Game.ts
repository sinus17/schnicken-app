import type { Spieler, Schnick, SchnickZahl } from '../lib/supabase';

// Make sure to use the same interface as in GameContext
export interface GameWithPlayers extends Schnick {
  schnicker: Spieler;
  angeschnickter: Spieler;
  runde1_zahlen?: SchnickZahl[];
  runde2_zahlen?: SchnickZahl[];
}

// Export as default (use 'export type' for verbatimModuleSyntax)
export type { GameWithPlayers as default }
