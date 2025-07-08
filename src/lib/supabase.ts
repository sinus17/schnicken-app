// Re-export the Supabase client from supabaseClient.ts
export { supabase, supabaseAdmin } from './supabaseClient';
export * from './supabaseClient';

// PostgreSQL-Verbindungsdaten gemäß Anforderungen
// Wird für direkte Datenbankinteraktionen oder Migrations-Skripte verwendet
export const DB_CONNECTION_STRING = 'postgresql://postgres.sfeckdcnlczdtvwpdxer:datenbankpasswort@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';

// Beachte: Wir nutzen jetzt die echte Supabase URL für alle Operationen,
// da es sonst zu 401-Fehlern bei der Authentifizierung kommt.

// Tatsächliche Supabase URL für direkte API-Aufrufe
export const ACTUAL_SUPABASE_URL = 'https://sfeckdcnlczdtvwpdxer.supabase.co';

// Public anon key für normale Operationen
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTUzNjYsImV4cCI6MjA2NzM5MTM2Nn0.rfJ8ry0C_C7sGfyw2KoU953PrqDSW9BoM2GAffoc1-8';

// Service Role Key für erweiterte Server-Operationen
export const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgxNTM2NiwiZXhwIjoyMDY3MzkxMzY2fQ.a5SnwwzoQJnoZu1eYTEPX4vB7va4YYLGBYoKGJGQZRw';

// Diese URL wird für Deployment verwendet
export const DEPLOY_URL = 'https://schnicken.netlify.app/';

// Re-export types
import type { Database } from '../types/database.types';
export type Tables = Database['public']['Tables'];
export type Spieler = Tables['spieler']['Row'];
export type Schnick = Tables['schnicks']['Row'];
export type SchnickZahl = Tables['schnick_zahlen']['Row'];

// Define SpielerSchnick interface explicitly since it may not be in the generated types
export interface SpielerSchnick {
  id: string;
  created_at: string;
  spieler_id: string;
  schnick_id: string;
}
