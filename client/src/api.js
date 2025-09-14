const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/api';

async function http(path, options = {}) {
  const { signal, headers, ...rest } = options;
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
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

/* sessions */
export const login = (username, password) =>
  http('/sessions', { method:'POST', body: JSON.stringify({ username, password }) });
export const register = (username, password) =>
  http('/users', { method:'POST', body: JSON.stringify({ username, password }) });
export const me = async (opt) => {
  try {
    return await http('/sessions/current', { method: 'GET', ...(opt || {}) });
  } catch (err) {
    if (err.status === 401) {
      return null;
    }
    throw err;
  }
};
export const logout = () => http('/sessions/current', { method:'DELETE' });

/* users quick */
export const meSnapshot = () => http('/me', { method:'GET' });

/* butterfly */
export const getButterfly = () => http('/butterfly', { method:'GET' });

/* letter costs */
export const getLetterCosts = () => http('/letters/costs', { method:'GET' });

/* matches (logged) */
export const startMatch = () => http('/matches', { method:'POST' });
export const currentMatch = () => http('/matches/current', { method:'GET' });
export const guessLetter = (id, letter) =>
  http(`/matches/${id}/guess-letter`, { method:'POST', body: JSON.stringify({ letter }) });
export const guessSentence = (id, sentence) =>
  http(`/matches/${id}/guess-sentence`, { method:'POST', body: JSON.stringify({ sentence }) });
export const abandonMatch = (id) =>
  http(`/matches/${id}/abandon`, { method:'POST' });

/* matches (guest) */
export const guestStart = () => http('/guest/matches', { method:'POST' });
export const guestCurrent = (id) => http(`/guest/matches/current/${id}`, { method:'GET' });
export const guestGuessLetter = (id, letter) =>
  http(`/guest/matches/${id}/guess-letter`, { method:'POST', body: JSON.stringify({ letter }) });
export const guestGuessSentence = (id, sentence) =>
  http(`/guest/matches/${id}/guess-sentence`, { method:'POST', body: JSON.stringify({ sentence }) });
export const guestAbandon = (id) =>
  http(`/guest/matches/${id}/abandon`, { method:'POST' });

export const api = {
  login, register, me, logout, meSnapshot,
  getButterfly, getLetterCosts,
  startMatch, currentMatch, guessLetter, guessSentence, abandonMatch,
  guestStart, guestCurrent, guestGuessLetter, guestGuessSentence, guestAbandon,
  // Aliases for consistency
  abandonGuestMatch: guestAbandon
};
