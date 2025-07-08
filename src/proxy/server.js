// Simplified proxy server for Supabase authentication - SIGNUP ONLY
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for frontend requests
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'X-Client-Info']
}));
app.use(express.json());

console.log('Starting Schnicken Auth Proxy Server (Signup Only)...');

// Define Supabase URL and key
const supabaseUrl = 'https://sfeckdcnlczdtvwpdxer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgxNTM2NiwiZXhwIjoyMDY3MzkxMzY2fQ.a5SnwwzoQJnoZu1eYTEPX4vB7va4YYLGBYoKGJGQZRw';

// Create Supabase admin client with service role key
const adminClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Proxy server initialized with Supabase service role key');

// API endpoint for signup with username - clean implementation
app.post('/proxy/auth/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({
        error: { message: 'Email, password, and username are required' }
      });
    }

    console.log(`Processing signup for ${email} with username: ${username}`);

    // Step 1: Create the user account with admin privileges
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { display_name: username }
    });

    if (userError) {
      console.error('Error creating user:', userError);
      return res.status(400).json({ error: userError });
    }

    // Step 2: Create player profile in spieler table
    try {
      // IMPORTANT: Only include fields that actually exist in the spieler table
      const { data: newPlayer, error: playerError } = await adminClient
        .from('spieler')
        .insert({
          name: username,
          email: email,
          user_id: userData.user.id,
          created_at: new Date().toISOString()
          // Do NOT include avatar_url as it doesn't exist in the table
        })
        .select();

      if (playerError) {
        console.error('Error creating player profile:', playerError);
        // Continue anyway since the user was created
      } else {
        console.log('Player profile created successfully');
      }
    } catch (playerErr) {
      console.error('Exception creating player profile:', playerErr);
    }

    // Return success with user data
    return res.status(200).json({ user: userData.user });
  } catch (err) {
    console.error('Unexpected error during signup:', err);
    return res.status(500).json({
      error: { message: 'Unexpected server error during signup', details: err.message }
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log('Signup endpoint: http://localhost:3001/proxy/auth/signup');
});
  try {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({
        error: 'Email, password, and username are required'
      });
    }
    
    console.log('Proxy server: Creating user with username:', username);
    
    // Step 1: Create the user with service role key
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        display_name: username
      },
      email_confirm: true // Auto-confirm the email
    });
    
    if (authError) {
      console.error('Proxy server: Error signing up:', authError);
      return res.status(400).json({ error: authError });
    }
    
    // Step 2: Create player profile in the spieler table
    try {
      const { data: playerData, error: playerError } = await supabase
        .from('spieler')
        .insert([
          { 
            user_id: authData.user.id,
            name: username,
            email: email
          }
        ]);
        
      if (playerError) {
        console.error('Error creating player profile:', playerError);
        // Don't return here - we created the user successfully so we want to return that
      } else {
        console.log('Successfully created player profile');
      }
      
      return res.status(200).json({ user: authData.user });
      
    } catch (dbError) {
      console.error('Database error creating player:', dbError);
      // Still return the created user
      return res.status(200).json({ 
        user: authData.user, 
        warning: 'User created but player profile creation failed'
      });
    }
  } catch (error) {
    console.error('Proxy server: Unexpected error during signup:', error);
    return res.status(500).json({ error: { message: 'Server error during signup' } });
  }
});

// Sign in endpoint
app.post('/proxy/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }
    
    console.log('Proxy server: Signing in user:', email);
    
    // Use admin.signInWithPassword for more control and to ensure session is properly created
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Proxy server: Error signing in:', error);
      return res.status(400).json({ error });
    }
    
    console.log('Signin successful, returning session and user data');
    return res.status(200).json({ session: data.session, user: data.user });
  } catch (error) {
    console.error('Proxy server: Unexpected error during signin:', error);
    return res.status(500).json({ error: { message: 'Server error during signin' } });
  }
});

// API endpoint for games
app.get('/api/games', async (req, res) => {
  try {
    const { data, error } = await supabase.from('schnicks').select('*');
    res.json({ success: true, data, error });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API endpoint for players
app.get('/api/players', async (req, res) => {
  try {
    const { data, error } = await supabase.from('spieler').select('*');
    res.json({ success: true, data, error });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API endpoint for game numbers
app.get('/api/numbers', async (req, res) => {
  try {
    const { data, error } = await supabase.from('schnick_zahlen').select('*');
    res.json({ success: true, data, error });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API endpoint to create a test game
app.post('/api/create-test-game', async (req, res) => {
  try {
    // 1. Get or create test players
    let { data: players } = await supabase.from('spieler').select('*').limit(2);
    
    if (!players || players.length < 2) {
      await supabase.from('spieler').insert([
        { name: 'Test Spieler 1', avatar_url: null },
        { name: 'Test Spieler 2', avatar_url: null }
      ]);
      
      players = (await supabase.from('spieler').select('*').limit(2)).data;
    }
    
    if (players && players.length >= 2) {
      // Create game
      const { data: game } = await supabase.from('schnicks').insert([{
        schnicker_id: players[0].id,
        angeschnickter_id: players[1].id,
        aufgabe: 'Test Aufgabe',
        bock_wert: 5,
        status: 'offen',
        ergebnis: null
      }]).select().single();
      
      if (game) {
        // Create player links
        await supabase.from('spieler_schnicks').insert([
          { spieler_id: players[0].id, schnick_id: game.id },
          { spieler_id: players[1].id, schnick_id: game.id }
        ]);
        
        res.json({ success: true, gameId: game.id });
        return;
      }
    }
    
    res.status(500).json({ success: false, error: 'Failed to create test game' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// Auth proxy endpoint to handle Google OAuth flow
app.get('/auth/v1/authorize', async (req, res) => {
  try {
    console.log('Auth proxy request received:', req.url);
    const { provider, redirect_to } = req.query;
    
    if (provider !== 'google') {
      return res.status(400).json({ error: 'Only Google provider is supported' });
    }
    
    // Construct the actual Supabase OAuth URL
    const supabaseAuthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect_to || 'http://localhost:3000')}`;
    
    console.log('Redirecting to Supabase auth URL:', supabaseAuthUrl);
    
    // Redirect to the actual Supabase OAuth URL
    return res.redirect(supabaseAuthUrl);
  } catch (error) {
    console.error('Auth proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Catch-all route for other auth endpoints
app.all('/auth/*', async (req, res) => {
  try {
    const targetUrl = `${supabaseUrl}${req.url}`;
    console.log(`Proxying ${req.method} request to: ${targetUrl}`);
    
    // Using native fetch instead of axios
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(supabaseUrl).host,
        origin: supabaseUrl,
        apikey: supabaseKey
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });
    
    // Forward the response from Supabase
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
  console.log('Using Supabase project: https://sfeckdcnlczdtvwpdxer.supabase.co');
  console.log('Database: postgresql://postgres.sfeckdcnlczdtvwpdxer:datenbankpasswort@aws-0-eu-central-1.pooler.supabase.com:5432/postgres');
  console.log(`Auth endpoints available at http://localhost:${PORT}/proxy/auth/*`);
});
