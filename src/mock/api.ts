import type { Spieler, Schnick, SchnickZahl } from '../lib/supabase';

// Mock-Spieler für die lokale Entwicklung
export const mockSpieler: Spieler[] = [
  {
    id: '1',
    name: 'Max',
    created_at: new Date().toISOString(),
    avatar_url: null
  },
  {
    id: '2',
    name: 'Anna',
    created_at: new Date().toISOString(),
    avatar_url: null
  },
  {
    id: '3',
    name: 'Leon',
    created_at: new Date().toISOString(),
    avatar_url: null
  },
  {
    id: '4',
    name: 'Emma',
    created_at: new Date().toISOString(),
    avatar_url: null
  }
];

// Mock-API-Funktionen, die die Supabase-API simulieren
export const mockApi = {
  // Spieler-Funktionen
  async getAllPlayers(): Promise<{ data: Spieler[], error: null | any }> {
    return { data: mockSpieler, error: null };
  },
  
  async createPlayer(name: string): Promise<{ data: Spieler | null, error: null | any }> {
    if (!name.trim()) {
      return { data: null, error: { message: 'Name darf nicht leer sein' } };
    }
    
    const newPlayer: Spieler = {
      id: String(Date.now()),
      name,
      created_at: new Date().toISOString(),
      avatar_url: null
    };
    
    mockSpieler.push(newPlayer);
    return { data: newPlayer, error: null };
  },
  
  // Schnicks-Funktionen
  async createSchnick(_playerIds: string[]): Promise<{ data: Schnick | null, error: null | any }> {
    const newSchnick: Schnick = {
      id: String(Date.now()),
      created_at: new Date().toISOString(),
      schnicker_id: '',
      angeschnickter_id: '',
      aufgabe: 'Mock Aufgabe',
      bock_wert: 0,
      status: 'offen',
      ergebnis: null
    };
    
    return { data: newSchnick, error: null };
  },
  
  async getSchnick(id: string): Promise<{ data: Schnick | null, error: null | any }> {
    return { data: {
      id,
      created_at: new Date().toISOString(),
      schnicker_id: '',
      angeschnickter_id: '',
      aufgabe: 'Mock Aufgabe',
      bock_wert: 0,
      status: 'offen',
      ergebnis: null
    }, error: null };
  },
  
  async submitZahl(schnickId: string, spielerId: string, zahl: number): Promise<{ data: SchnickZahl | null, error: null | any }> {
    const newZahl: SchnickZahl = {
      id: String(Date.now()),
      schnick_id: schnickId,
      spieler_id: spielerId,
      runde: 1,  // Default to round 1
      zahl,
      created_at: new Date().toISOString()
    };
    
    return { data: newZahl, error: null };
  }
};
