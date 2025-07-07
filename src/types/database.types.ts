export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      spieler: {
        Row: {
          id: string
          created_at: string
          name: string
          avatar_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          avatar_url?: string | null
        }
      }
      schnicks: {
        Row: {
          id: string
          created_at: string
          schnicker_id: string
          angeschnickter_id: string
          aufgabe: string
          bock_wert: number
          status: 'offen' | 'runde1' | 'runde2' | 'beendet'
          ergebnis: 'schnicker' | 'angeschnickter' | 'unentschieden' | null
        }
        Insert: {
          id?: string
          created_at?: string
          schnicker_id: string
          angeschnickter_id: string
          aufgabe: string
          bock_wert: number
          status?: 'offen' | 'runde1' | 'runde2' | 'beendet'
          ergebnis?: 'schnicker' | 'angeschnickter' | 'unentschieden' | null
        }
        Update: {
          id?: string
          created_at?: string
          schnicker_id?: string
          angeschnickter_id?: string
          aufgabe?: string
          bock_wert?: number
          status?: 'offen' | 'runde1' | 'runde2' | 'beendet'
          ergebnis?: 'schnicker' | 'angeschnickter' | 'unentschieden' | null
        }
      }
      schnick_zahlen: {
        Row: {
          id: string
          created_at: string
          schnick_id: string
          spieler_id: string
          runde: 1 | 2
          zahl: number
        }
        Insert: {
          id?: string
          created_at?: string
          schnick_id: string
          spieler_id: string
          runde: 1 | 2
          zahl: number
        }
        Update: {
          id?: string
          created_at?: string
          schnick_id?: string
          spieler_id?: string
          runde?: 1 | 2
          zahl?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
