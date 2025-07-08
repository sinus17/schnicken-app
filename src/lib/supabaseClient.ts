import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Singleton Supabase clients to prevent multiple instances
export const ACTUAL_SUPABASE_URL = 'https://sfeckdcnlczdtvwpdxer.supabase.co';

// Public anon key for normal operations
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTUzNjYsImV4cCI6MjA2NzM5MTM2Nn0.rfJ8ry0C_C7sGfyw2KoU953PrqDSW9BoM2GAffoc1-8';

// Service role key for admin operations (bypasses RLS)
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgxNTM2NiwiZXhwIjoyMDY3MzkxMzY2fQ.a5SnwwzoQJnoZu1eYTEPX4vB7va4YYLGBYoKGJGQZRw';

// Create singleton clients using the correct configuration
export const supabase = createClient<Database>(ACTUAL_SUPABASE_URL, supabaseAnonKey, {
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

export const supabaseAdmin = createClient(ACTUAL_SUPABASE_URL, serviceRoleKey);
