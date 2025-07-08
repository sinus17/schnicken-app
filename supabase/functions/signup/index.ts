import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key (for admin privileges)
    const supabaseUrl = 'https://sfeckdcnlczdtvwpdxer.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgxNTM2NiwiZXhwIjoyMDY3MzkxMzY2fQ.a5SnwwzoQJnoZu1eYTEPX4vB7va4YYLGBYoKGJGQZRw'
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Parse request body
    const { email, password, username } = await req.json()

    // Sign up with email, password, and username
    if (!email || !password || !username) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and username are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Edge function: Attempting to create user:', { email, username })

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'http://localhost:3000',
        data: {
          display_name: username
        }
      }
    })

    if (error) {
      console.error('Edge function: Error signing up:', JSON.stringify(error, null, 2))
      return new Response(
        JSON.stringify({ error: { message: error.message, code: error.code } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a player record in the spieler table
    if (data.user) {
      console.log('Edge function: User created successfully, creating player profile for:', data.user.id)
      
      const { data: playerData, error: playerError } = await supabase
        .from('spieler')
        .insert({
          name: username,
          email: email,
          user_id: data.user.id
        })
        .select('id')

      if (playerError) {
        console.error('Edge function: Error creating player profile:', JSON.stringify(playerError, null, 2))
      } else {
        console.log('Edge function: Player profile created successfully:', playerData)
      }
    } else {
      console.error('Edge function: No user data returned from sign-up')
    }

    return new Response(
      JSON.stringify({ user: data.user }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge function: Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
