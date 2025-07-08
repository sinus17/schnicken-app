// Re-export the Supabase client from supabaseClient.ts
// We ensure only ONE instance of Supabase client exists throughout the app
export { supabase, supabaseAdmin } from './supabaseClient';
export { 
  ACTUAL_SUPABASE_URL,
  supabaseAnonKey
} from './supabaseClient';

// Database connection string
export const DB_CONNECTION_STRING = 'postgresql://postgres.sfeckdcnlczdtvwpdxer:datenbankpasswort@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';

// Deployment URL
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
