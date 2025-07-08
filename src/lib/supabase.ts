import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// PostgreSQL-Verbindungsdaten gemäß Anforderungen
// Wird für direkte Datenbankinteraktionen oder Migrations-Skripte verwendet
export const DB_CONNECTION_STRING = 'postgresql://postgres.sfeckdcnlczdtvwpdxer:datenbankpasswort@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';

// Für die Client-Verbindung verwenden wir einen Standard-Supabase-Client
// Gemäß der Benutzerregel: "only use localhost:3000"

// Gemäß der Benutzerregel: "only use localhost:3000"
const supabaseUrl = 'http://localhost:3000';

// Für Google Auth funktionalität benötigen wir die echte Supabase URL
// Diese wird nur für die Weiterleitung zu Google OAuth verwendet
export const SUPABASE_AUTH_URL = 'https://sfeckdcnlczdtvwpdxer.supabase.co';

// Service-Role-Key für erweiterte Berechtigungen
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgxNTM2NiwiZXhwIjoyMDY3MzkxMzY2fQ.a5SnwwzoQJnoZu1eYTEPX4vB7va4YYLGBYoKGJGQZRw';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
  },
});

// Diese URL wird für Deployment verwendet
export const DEPLOY_URL = 'https://schnicken.netlify.app/';

// Datenbank-Typendefinitionen für TypeScript
export type Tables = Database['public']['Tables'];
export type Spieler = Tables['spieler']['Row'];
export type Schnick = Tables['schnicks']['Row'];
export type SchnickZahl = Tables['schnick_zahlen']['Row'];
