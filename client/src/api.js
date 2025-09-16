/**
 * API Client for Word Guessing Game
 * Handles all HTTP communication with the backend server
 */

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/api';

/**
 * Generic HTTP request handler with error handling
 * @param {string} path - API endpoint path
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise} Response data or null for 204 status
 */
async function http(path, options = {}) {
  const { signal, headers, ...rest } = options;
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include', // Include cookies for session management
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    signal,
    ...rest,
  });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

// ============================================================================
// AUTHENTICATION & USER MANAGEMENT
// ============================================================================

/**
 * Authenticate user with username and password
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise<object>} User session data
 */
export const login = (username, password) =>
  http('/sessions', { method:'POST', body: JSON.stringify({ username, password }) });

/**
 * Register a new user account
 * @param {string} username - Desired username
 * @param {string} password - User's password
 * @returns {Promise<object>} New user data
 */
export const register = (username, password) =>
  http('/users', { method:'POST', body: JSON.stringify({ username, password }) });

/**
 * Get current authenticated user information
 * @param {object} opt - Optional fetch options
 * @returns {Promise<object|null>} Current user data or null if not authenticated
 */
export const me = async (opt) => {
  try {
    return await http('/sessions/current', { method: 'GET', ...(opt || {}) });
  } catch (err) {
    if (err.status === 401) {
      return null; // User not authenticated
    }
    throw err;
  }
};

/**
 * Log out current user and destroy session
 * @returns {Promise<null>} No return data
 */
export const logout = () => http('/sessions/current', { method:'DELETE' });

// ============================================================================
// USER DATA & GAME STATISTICS
// ============================================================================

/**
 * Get quick snapshot of current user (coins, stats, etc.)
 * Lightweight endpoint for frequent updates
 * @returns {Promise<object>} User snapshot with current coins and basic info
 */
export const meSnapshot = () => http('/me', { method:'GET' });

// ============================================================================
// GAME DATA & UTILITIES
// ============================================================================

/**
 * Get random letters with frequencies and costs for the butterfly component
 * @returns {Promise<Array>} Array of letter objects [{letter, frequency, cost}]
 */
export const getButterfly = () => http('/butterfly', { method:'GET' });

/**
 * Get cost mapping for all letters (A-Z)
 * @returns {Promise<object>} Object mapping letters to their costs {A: 10, B: 2, ...}
 */
export const getLetterCosts = () => http('/letters/costs', { method:'GET' });

// ============================================================================
// AUTHENTICATED USER MATCHES
// ============================================================================

/**
 * Start a new match for authenticated user
 * Costs coins and creates a new game session
 * @returns {Promise<object>} New match object with sentence, timer, etc.
 */
export const startMatch = () => http('/matches', { method:'POST' });

/**
 * Get current active match for authenticated user
 * @returns {Promise<object|null>} Current match data or null if no active match
 */
export const currentMatch = () => http('/matches/current', { method:'GET' });

/**
 * Guess a letter in the current match
 * @param {number} id - Match ID
 * @param {string} letter - Single letter to guess (A-Z)
 * @returns {Promise<object>} Updated match state and result message
 */
export const guessLetter = (id, letter) =>
  http(`/matches/${id}/guess-letter`, { method:'POST', body: JSON.stringify({ letter }) });

/**
 * Guess the complete sentence
 * @param {number} id - Match ID  
 * @param {string} sentence - Complete sentence guess
 * @returns {Promise<object>} Updated match state and result message
 */
export const guessSentence = (id, sentence) =>
  http(`/matches/${id}/guess-sentence`, { method:'POST', body: JSON.stringify({ sentence }) });

/**
 * Abandon current match (forfeit)
 * @param {number} id - Match ID
 * @returns {Promise<null>} No return data
 */
export const abandonMatch = (id) =>
  http(`/matches/${id}/abandon`, { method:'POST' });

// ============================================================================
// GUEST MODE MATCHES (NO AUTHENTICATION REQUIRED)
// ============================================================================

/**
 * Start a new guest match (no coins required)
 * @returns {Promise<object>} New guest match object
 */
export const guestStart = () => http('/guest/matches', { method:'POST' });

/**
 * Get current guest match by ID
 * @param {number} id - Guest match ID
 * @returns {Promise<object|null>} Guest match data or null
 */
export const guestCurrent = (id) => http(`/guest/matches/current/${id}`, { method:'GET' });

/**
 * Guess a letter in guest match (free, no coin cost)
 * @param {number} id - Guest match ID
 * @param {string} letter - Single letter to guess (A-Z)
 * @returns {Promise<object>} Updated guest match state and result message
 */
export const guestGuessLetter = (id, letter) =>
  http(`/guest/matches/${id}/guess-letter`, { method:'POST', body: JSON.stringify({ letter }) });

/**
 * Guess the complete sentence in guest match
 * @param {number} id - Guest match ID
 * @param {string} sentence - Complete sentence guess
 * @returns {Promise<object>} Updated guest match state and result message
 */
export const guestGuessSentence = (id, sentence) =>
  http(`/guest/matches/${id}/guess-sentence`, { method:'POST', body: JSON.stringify({ sentence }) });

/**
 * Abandon guest match (no coin penalty)
 * @param {number} id - Guest match ID
 * @returns {Promise<null>} No return data
 */
export const guestAbandon = (id) =>
  http(`/guest/matches/${id}/abandon`, { method:'POST' });

// ============================================================================
// EXPORTED API OBJECT
// ============================================================================

/**
 * Main API object with all available endpoints
 * Provides both individual exports and grouped object for convenience
 */
export const api = {
  // Authentication & User Management
  login, 
  register, 
  me, 
  logout, 
  meSnapshot,
  
  // Game Data & Utilities
  getButterfly, 
  getLetterCosts,
  
  // Authenticated User Matches
  startMatch, 
  currentMatch, 
  guessLetter, 
  guessSentence, 
  abandonMatch,
  
  // Guest Mode Matches
  guestStart, 
  guestCurrent, 
  guestGuessLetter, 
  guestGuessSentence, 
  guestAbandon,
  
  // Legacy aliases for backward compatibility
  abandonGuestMatch: guestAbandon
};
