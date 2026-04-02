// multiplayer.js — Real-time multiplayer manager using Supabase

class MultiplayerManager {
  constructor() {
    this.supabase = null;
    this.roomId = null;
    this.localPlayer = null; // "D" or "F"
    this.sessionId = this._getOrCreateSessionId();
    this.channel = null;
    this.currentState = null;
    this.onStateUpdate = null; // callback
  }

  _getOrCreateSessionId() {
    let id = localStorage.getItem('bdn_session_id');
    if (!id) {
      id = 'sess_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
      localStorage.setItem('bdn_session_id', id);
    }
    return id;
  }

  init() {
    if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      throw new Error('Supabase not configured. Edit config.js with your project credentials.');
    }
    this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  _generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  // Create a new game room with initial state
  async createRoom(initialState) {
    this.roomId = this._generateRoomCode();
    const { error } = await this.supabase
      .from('games')
      .insert({ id: this.roomId, state: initialState });
    if (error) throw new Error('Failed to create room: ' + error.message);
    this.currentState = initialState;
    localStorage.setItem('bdn_room_id', this.roomId);
    return this.roomId;
  }

  // Join an existing room by code
  async joinRoom(roomId) {
    this.roomId = roomId.toUpperCase().trim();
    const { data, error } = await this.supabase
      .from('games')
      .select('state')
      .eq('id', this.roomId)
      .single();
    if (error || !data) throw new Error('Room not found: ' + this.roomId);
    this.currentState = data.state;
    localStorage.setItem('bdn_room_id', this.roomId);
    return this.currentState;
  }

  // Claim a player role (D or F)
  async claimRole(player) {
    // Fetch fresh state to avoid stale reads
    const { data, error } = await this.supabase
      .from('games')
      .select('state')
      .eq('id', this.roomId)
      .single();
    if (error) throw error;

    const state = data.state;
    const players = state.players || {};

    // Check if role is taken by someone else
    if (players[player] && players[player] !== this.sessionId) {
      return false;
    }

    // Claim the role
    players[player] = this.sessionId;
    state.players = players;

    // Move to setup as soon as any role is claimed so players can place ships immediately.
    // Gameplay only begins once BOTH players mark setup ready.
    state.phase = 'setup';
    state.setupState = state.setupState || {
      D: { ready: false, placements: [] },
      F: { ready: false, placements: [] }
    };

    await this.pushState(state);
    this.localPlayer = player;
    localStorage.setItem('bdn_player', player);
    return true;
  }

  // Subscribe to real-time state changes
  subscribe(callback) {
    this.onStateUpdate = callback;
    this.channel = this.supabase
      .channel('game-' + this.roomId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: 'id=eq.' + this.roomId
      }, (payload) => {
        this.currentState = payload.new.state;
        if (this.onStateUpdate) {
          this.onStateUpdate(this.currentState);
        }
      })
      .subscribe();
  }

  // Push game state to Supabase
  async pushState(state) {
    this.currentState = state;
    const { error } = await this.supabase
      .from('games')
      .update({ state: state, updated_at: new Date().toISOString() })
      .eq('id', this.roomId);
    if (error) throw new Error('Failed to push state: ' + error.message);
  }

  // Load persistent player profiles (answered questions)
  async loadProfiles() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*');

    // Graceful fallback for projects that haven't run schema.sql yet.
    // The game can still run using in-memory defaults.
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (
        error.code === 'PGRST205' ||
        msg.includes("could not find the table 'public.profiles'") ||
        msg.includes('relation "public.profiles" does not exist')
      ) {
        console.warn('profiles table missing; using default empty profiles.', error);
        return { D: [], F: [] };
      }
      throw error;
    }

    const profiles = { D: [], F: [] };
    if (data) {
      data.forEach(row => {
        profiles[row.player] = row.answered || [];
      });
    }
    return profiles;
  }

  // Save answered questions for a player to profiles table
  async saveProfile(player, answered) {
    const { error } = await this.supabase
      .from('profiles')
      .upsert({
        player: player,
        answered: answered,
        updated_at: new Date().toISOString()
      });
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (
        error.code === 'PGRST205' ||
        msg.includes("could not find the table 'public.profiles'") ||
        msg.includes('relation "public.profiles" does not exist')
      ) {
        console.warn('profiles table missing; skipping profile persistence.', error);
        return;
      }
      throw error;
    }
  }

  // Try to reconnect from a previous session
  async tryReconnect() {
    const roomId = localStorage.getItem('bdn_room_id');
    const player = localStorage.getItem('bdn_player');
    if (!roomId || !player) return null;

    try {
      const state = await this.joinRoom(roomId);
      const players = state.players || {};
      // Verify our session still owns this role
      if (players[player] === this.sessionId) {
        this.localPlayer = player;
        return { roomId, player, state };
      }
    } catch (e) {
      // Room doesn't exist or other error — fall through
    }
    return null;
  }

  // Clean up subscription
  disconnect() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
