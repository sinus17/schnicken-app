import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// WhatsApp configuration (mirrors src/services/WhatsAppService.ts)
const WHAPI_URL = 'https://gate.whapi.cloud'
const WHAPI_TOKEN = 'coRWJTwRGdqohY8gykipkezKA4SPO5dh'
const WHAPI_CHANNEL = 'ROCKET-24F79'
const WHAPI_GROUP = '120363394823396676@g.us'
const APP_URL = 'https://schnicken.netlify.app/'

const REMINDER_AGE_MS = 15 * 60 * 1000 // 15 minutes

type Spieler = { id: string; name: string }
type SchnickZahl = { schnick_id: string; spieler_id: string; runde: number }
type Schnick = {
  id: string
  status: 'offen' | 'runde1' | 'runde2' | 'beendet'
  bock_wert: number | null
  aufgabe: string
  created_at: string
  schnicker_id: string
  angeschnickter_id: string
}

type ActionType = 'bock_input_needed' | 'round1_input_needed' | 'round2_input_needed'

interface PendingAction {
  schnick: Schnick
  player: Spieler
  opponent: Spieler
  actionType: ActionType
  pendingSince: string
}

const sendWhatsApp = async (message: string) => {
  const res = await fetch(`${WHAPI_URL}/messages/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WHAPI_TOKEN}`,
      'X-Channel': WHAPI_CHANNEL,
    },
    body: JSON.stringify({ to: WHAPI_GROUP, body: message }),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`WHAPI error ${res.status}: ${errText}`)
  }
  return res.json()
}

const buildReminderMessage = (
  player: Spieler,
  opponent: Spieler,
  schnick: Schnick,
  actionType: ActionType,
): string => {
  let actionDescription = ''
  let emoji = '⏰'

  switch (actionType) {
    case 'bock_input_needed':
      actionDescription = `einen Bock-Wert für den Schnick von *${opponent.name}* einzugeben`
      emoji = '💰'
      break
    case 'round1_input_needed':
      actionDescription = `eine Zahl für *Runde 1* abzugeben (Schnick mit ${opponent.name})`
      emoji = '1️⃣'
      break
    case 'round2_input_needed':
      actionDescription = `eine Zahl für *Runde 2* abzugeben (Schnick mit ${opponent.name})`
      emoji = '2️⃣'
      break
  }

  // Aufgabe wird genannt – Zahlen (Bock-Wert / Runden-Zahlen) bewusst NICHT.
  return (
    `${emoji} *REMINDER* ${emoji}\n\n` +
    `${player.name}, du musst seit über 15 Minuten ${actionDescription}.\n\n` +
    `Aufgabe: ${schnick.aufgabe}\n\n` +
    `🔔 Bitte öffne die App und reagiere:\n${APP_URL}`
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://sfeckdcnlczdtvwpdxer.supabase.co'
  const supabaseKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgxNTM2NiwiZXhwIjoyMDY3MzkxMzY2fQ.a5SnwwzoQJnoZu1eYTEPX4vB7va4YYLGBYoKGJGQZRw'

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const cutoff = new Date(Date.now() - REMINDER_AGE_MS).toISOString()

    // Lade alle aktiven Schnicks, die mind. 15 min alt sind
    const { data: schnicks, error: schnicksError } = await supabase
      .from('schnicks')
      .select('id, status, bock_wert, aufgabe, created_at, schnicker_id, angeschnickter_id')
      .neq('status', 'beendet')
      .lte('created_at', cutoff)
      .returns<Schnick[]>()

    if (schnicksError) throw schnicksError
    if (!schnicks || schnicks.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const schnickIds = schnicks.map((s) => s.id)
    const playerIds = Array.from(
      new Set(schnicks.flatMap((s) => [s.schnicker_id, s.angeschnickter_id])),
    )

    const [{ data: zahlen }, { data: spielerRows }, { data: existingReminders }] =
      await Promise.all([
        supabase.from('schnick_zahlen').select('schnick_id, spieler_id, runde').in('schnick_id', schnickIds).returns<SchnickZahl[]>(),
        supabase.from('spieler').select('id, name').in('id', playerIds).returns<Spieler[]>(),
        supabase
          .from('schnick_reminders')
          .select('schnick_id, spieler_id, action_type')
          .in('schnick_id', schnickIds),
      ])

    const playerMap = new Map<string, Spieler>((spielerRows ?? []).map((p) => [p.id, p]))
    const reminderKey = (schnickId: string, spielerId: string, action: string) =>
      `${schnickId}:${spielerId}:${action}`
    const existingSet = new Set<string>(
      (existingReminders ?? []).map((r: { schnick_id: string; spieler_id: string; action_type: string }) =>
        reminderKey(r.schnick_id, r.spieler_id, r.action_type),
      ),
    )

    const pending: PendingAction[] = []

    for (const s of schnicks) {
      const schnicker = playerMap.get(s.schnicker_id)
      const angeschnickter = playerMap.get(s.angeschnickter_id)
      if (!schnicker || !angeschnickter) continue

      const r1 = (zahlen ?? []).filter((z) => z.schnick_id === s.id && z.runde === 1)
      const r2 = (zahlen ?? []).filter((z) => z.schnick_id === s.id && z.runde === 2)

      const r1HasSchnicker = r1.some((z) => z.spieler_id === s.schnicker_id)
      const r1HasAngeschnickter = r1.some((z) => z.spieler_id === s.angeschnickter_id)
      const r2HasSchnicker = r2.some((z) => z.spieler_id === s.schnicker_id)
      const r2HasAngeschnickter = r2.some((z) => z.spieler_id === s.angeschnickter_id)

      const candidates: Array<{ player: Spieler; opponent: Spieler; actionType: ActionType }> = []

      if (s.status === 'offen') {
        if (s.bock_wert === null) {
          // Angeschnickter muss Bock-Wert setzen
          candidates.push({
            player: angeschnickter,
            opponent: schnicker,
            actionType: 'bock_input_needed',
          })
        } else {
          // Bock gesetzt: jeder, der noch keine Runde-1-Zahl hat, ist dran
          if (!r1HasSchnicker)
            candidates.push({
              player: schnicker,
              opponent: angeschnickter,
              actionType: 'round1_input_needed',
            })
          if (!r1HasAngeschnickter)
            candidates.push({
              player: angeschnickter,
              opponent: schnicker,
              actionType: 'round1_input_needed',
            })
        }
      } else if (s.status === 'runde1') {
        if (!r1HasSchnicker)
          candidates.push({
            player: schnicker,
            opponent: angeschnickter,
            actionType: 'round1_input_needed',
          })
        if (!r1HasAngeschnickter)
          candidates.push({
            player: angeschnickter,
            opponent: schnicker,
            actionType: 'round1_input_needed',
          })
      } else if (s.status === 'runde2') {
        if (!r2HasSchnicker)
          candidates.push({
            player: schnicker,
            opponent: angeschnickter,
            actionType: 'round2_input_needed',
          })
        if (!r2HasAngeschnickter)
          candidates.push({
            player: angeschnickter,
            opponent: schnicker,
            actionType: 'round2_input_needed',
          })
      }

      for (const c of candidates) {
        if (existingSet.has(reminderKey(s.id, c.player.id, c.actionType))) continue
        pending.push({
          schnick: s,
          player: c.player,
          opponent: c.opponent,
          actionType: c.actionType,
          pendingSince: s.created_at,
        })
      }
    }

    const results: Array<{ schnick_id: string; spieler_id: string; action_type: string; ok: boolean; error?: string }> = []

    for (const p of pending) {
      const message = buildReminderMessage(p.player, p.opponent, p.schnick, p.actionType)
      try {
        await sendWhatsApp(message)
        await supabase
          .from('schnick_reminders')
          .insert({
            schnick_id: p.schnick.id,
            spieler_id: p.player.id,
            action_type: p.actionType,
          })
        results.push({
          schnick_id: p.schnick.id,
          spieler_id: p.player.id,
          action_type: p.actionType,
          ok: true,
        })
      } catch (err) {
        results.push({
          schnick_id: p.schnick.id,
          spieler_id: p.player.id,
          action_type: p.actionType,
          ok: false,
          error: (err as Error).message,
        })
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('send-reminders failed:', err)
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
