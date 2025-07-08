// Enhanced proxy server to maintain localhost:3000 while connecting to Supabase (including auth)
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3001;

// Enable CORS for frontend requests
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'X-Client-Info']
}));
app.use(express.json());

// Define Supabase URL and key
const supabaseUrl = 'https://sfeckdcnlczdtvwpdxer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgxNTM2NiwiZXhwIjoyMDY3MzkxMzY2fQ.a5SnwwzoQJnoZu1eYTEPX4vB7va4YYLGBYoKGJGQZRw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// API endpoint to test connection
app.get('/api/test', async (req, res) => {
  try {
    const { data, error } = await supabase.from('spieler').select('count');
    res.json({ success: true, data, error });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: new URL(supabaseUrl).host,
        origin: supabaseUrl,
      },
      data: req.body,
    });
    
    // Forward the response from Supabase
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Enhanced proxy server running on http://localhost:${PORT}`);
  console.log(`Auth endpoints available at http://localhost:${PORT}/auth/*`);
});
