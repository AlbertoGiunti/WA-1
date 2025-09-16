/**
 * Data Access Object for match-related database operations
 * Contains all SQL queries and match management functions
 */

import dayjs from 'dayjs';
import { getDb } from '../db.mjs';
import { letterCost } from '../domain/letters.mjs';
import { getUserCoins } from './users.mjs';

// Game configuration constants
const MATCH_SECONDS = 60;  // Duration of each game match in seconds
const TIME_PENALTY = 20;   // Coin penalty when time runs out

/**
 * Creates initial reveal mask for a sentence
 * Spaces are revealed (1), letters are hidden (0)
 * @param {string} sentenceU - Uppercase sentence
 * @returns {string} Binary mask string
 */
function buildMask(sentenceU) {
  return [...sentenceU].map(ch => ch === ' ' ? '1' : '0').join('');
}

/**
 * Updates the reveal mask when a letter is guessed
 * @param {string} sentenceU - Uppercase sentence
 * @param {string} mask - Current reveal mask
 * @param {string} letterU - Uppercase letter being guessed
 * @returns {string} Updated mask with revealed letters
 */
function revealMask(sentenceU, mask, letterU) {
  const arr = mask.split('');
  for (let i = 0; i < sentenceU.length; i++) {
    if (sentenceU[i] === letterU) arr[i] = '1';
  }
  return arr.join('');
}

/**
 * Checks if the entire sentence has been revealed
 * @param {string} mask - Current reveal mask
 * @param {string} sentenceU - Uppercase sentence
 * @returns {boolean} True if all letters are revealed
 */
function isAllRevealed(mask, sentenceU) {
  for (let i = 0; i < mask.length; i++) {
    if (sentenceU[i] !== ' ' && mask[i] === '0') return false;
  }
  return true;
}

/**
 * Gets the currently active match for a user or guest
 * @param {number|null} userId - User ID (null for guest)
 * @returns {Object|null} Active match object or null
 */
export async function currentMatch(userId) {
  const db = await getDb();
  
  // First, clean up any expired matches for this user
  const now = dayjs().unix();
  const expiredMatches = await db.all(
    `SELECT * FROM matches WHERE user_id IS ? AND status = 'playing' AND ends_at < ?`,
    [userId ?? null, now]
  );
  
  if (expiredMatches.length > 0) {
    for (const match of expiredMatches) {
      await closeIfTimeout(match);
    }
  }
  
  // Now get the current active match (includes recently finished matches for display)
  const m = await db.get(
    `SELECT * FROM matches 
     WHERE user_id IS ? 
     AND (status = "playing" OR (status IN ("won", "lost") AND started_at > ?))
     ORDER BY id DESC LIMIT 1`,
    [userId ?? null, now - 300] // Include finished matches from last 5 minutes
  );
  return m || null;
}

/**
 * Cleans up expired matches in the database
 * This should be called periodically or at server startup
 */
export async function cleanupExpiredMatches() {
  const db = await getDb();
  const now = dayjs().unix();
  
  // Find all expired playing matches and process them
  const expiredMatches = await db.all(
    `SELECT * FROM matches WHERE status = 'playing' AND ends_at < ?`,
    [now]
  );
  
  for (const match of expiredMatches) {
    await closeIfTimeout(match);
  }
}

/**
 * Creates a new match for a user or guest
 * @param {Object} params - Parameters
 * @param {number|null} params.userId - User ID (null for guest)
 * @param {boolean} params.guest - Whether this is a guest match
 * @returns {Object} New match object with initial state
 */
export async function startMatch({ userId = null, guest = false }) {
  const db = await getDb();
  const row = await db.get(
    'SELECT id, text FROM sentences WHERE is_guest=? ORDER BY RANDOM() LIMIT 1',
    [guest ? 1 : 0]
  );
  const sentenceU = row.text.toUpperCase();
  
  const now = dayjs();
  const ends = now.add(MATCH_SECONDS, 'second');
  const mask = buildMask(sentenceU);

  const res = await db.run(
    `INSERT INTO matches(user_id, sentence_id, started_at, ends_at, status, revealed_mask, guessed_letters, used_vowel)
     VALUES (?,?,?,?,?,?,?,?)`,
    [userId, row.id, now.unix(), ends.unix(), 'playing', mask, '', 0]
  );
  return await db.get('SELECT * FROM matches WHERE id=?', [res.lastID]);
}

/**
 * Checks if a match has timed out and applies penalties if necessary
 * @param {Object} m - Match object to check
 * @returns {Object} Updated match object (may have status changed to 'lost')
 */
async function closeIfTimeout(m) {
  const db = await getDb();
  const now = dayjs().unix();
  
  // Skip timeout check if match is not playing or still within time limit
  if (m.status !== 'playing') return m;
  if (now < m.ends_at) return m;

  // Match has timed out - apply penalties and update status
  if (m.user_id) {
    // Apply coin penalty for authenticated users (capped at current balance)
    const currentCoins = await getUserCoins(m.user_id);
    const penalty = Math.min(TIME_PENALTY, currentCoins);
    const newCoins = Math.max(0, currentCoins - penalty);
    
    await db.run('UPDATE users SET coins=? WHERE id=?', [newCoins, m.user_id]);
    await db.run('UPDATE matches SET status="lost" WHERE id=?', [m.id]);
  } else {
    // Guest matches timeout without penalties
    await db.run('UPDATE matches SET status="lost" WHERE id=?', [m.id]);
  }
  
  return await db.get('SELECT * FROM matches WHERE id=?', [m.id]);
}

/**
 * Gets a safe representation of a match for client consumption
 * @param {Object} m - Match object
 * @returns {Object} Safe match object with revealed information
 */
export async function getMatchSafe(m) {
  const db = await getDb();
  m = await closeIfTimeout(m);
  const s = await db.get('SELECT text FROM sentences WHERE id=?', [m.sentence_id]);
  const sentenceU = s.text.toUpperCase();

  // Create revealed array: null for spaces, letter if revealed, null if hidden
  const revealed = [...sentenceU].map((ch, i) => {
    if (ch === ' ') return null;                             // spaces always null
    return m.revealed_mask[i] === '1' ? ch : null;           // revealed letter vs not revealed
  });

  // Show complete sentence only when game is finished (won/lost), not for abandoned matches
  const fullSentence = (m.status !== 'playing' && m.status !== 'abandoned') ? sentenceU : null;

  const result = {
    id: m.id,
    status: m.status,
    endsAt: m.ends_at,
    revealedMask: m.revealed_mask,
    guessedLetters: m.guessed_letters.split('').filter(Boolean),
    usedVowel: !!m.used_vowel,
    spaces: [...sentenceU].map(ch => ch === ' '),
    revealed,
    sentence: fullSentence  // Complete sentence when game is finished
  };
  
  return result;
}

/**
 * Processes a letter guess for a game match
 * @param {Object} params - Parameters
 * @param {number} params.matchId - Match ID
 * @param {number|null} params.userId - User ID (null for guest)
 * @param {string} params.letter - Letter being guessed
 * @param {boolean} params.isGuestMode - Whether this is a guest mode game
 * @returns {Object} Result with updated match and message
 */
export async function guessLetter({ matchId, userId = null, letter, isGuestMode = false }) {
  const db = await getDb();
  const m = await db.get('SELECT * FROM matches WHERE id=?', [matchId]);
  if (!m || m.status !== 'playing') throw new Error('Match not playable');
  if ((userId ?? null) !== (m.user_id ?? null)) throw new Error('Unauthorized');

  // Check for timeout and update match status if necessary
  let mm = await closeIfTimeout(m);
  if (mm.status !== 'playing') return { match: await getMatchSafe(mm), message: 'Time over.' };

  const L = letter.toUpperCase();
  const isVowel = 'AEIOU'.includes(L);
  if (isVowel && mm.used_vowel) throw new Error('Vowel already used in this match.');

  const s = await db.get('SELECT text FROM sentences WHERE id=?', [mm.sentence_id]);
  const S = s.text.toUpperCase();

  const cost = letterCost(L);
  const present = S.includes(L);
  const effectiveCost = (present ? cost : cost * 2);  // Double cost for wrong guesses
  let penalty;
  
  // Coin validation and deduction for authenticated users
  let newCoins = null;
  if (mm.user_id) {
    const currentCoins = await getUserCoins(mm.user_id);
    
    // Validate user has enough coins for the base cost
    if (currentCoins < cost) {
      throw new Error(`Insufficient coins! You need at least ${cost} coins to guess this letter, but you only have ${currentCoins}.`);
    }

    // Calculate actual penalty (may be less than effective cost if user doesn't have enough)
    if (currentCoins < effectiveCost){
      penalty = currentCoins;  // Take all remaining coins if not enough for full penalty
    }else {
      penalty = effectiveCost;  // Full penalty
    }
    newCoins = Math.max(0, currentCoins - penalty);
  }

  // Update revealed mask if letter is present in sentence
  let newMask = mm.revealed_mask;
  if (present) newMask = revealMask(S, newMask, L);

  // Check if all letters have been revealed (win condition)
  const won = isAllRevealed(newMask, S);
  let status = mm.status;

  let message;
  if (present) {
    message = 'Letter revealed.';
  } else {
    // Different messages for guest vs authenticated users when letter is wrong
    if (isGuestMode) {
      message = 'Wrong letter! As a guest, you can try for free. If you weren\’t in guest mode, this mistake would cost you double!';
    } else {
      message = `Wrong letter! Cost doubled to ${penalty} coins.`;
    }
  }

  if (won) {
    status = 'won';
    if (!isGuestMode && mm.user_id) {
      message = 'You guessed all letters! You gained +100 coins!';
      newCoins = (newCoins ?? 0) + 100;
    } else {
      message = 'You guessed all letters! Excellent! 🎉';
    }
  }

  // Update guessed letters list (remove duplicates)
  const newGuessed = (mm.guessed_letters + L)
    .split('').filter((v,i,a)=>a.indexOf(v)===i).join('');

  // Update match state in database
  await db.run(
    `UPDATE matches SET revealed_mask=?, guessed_letters=?, used_vowel=?, status=?
     WHERE id=?`,
    [newMask, newGuessed, (mm.used_vowel || isVowel) ? 1 : 0, status, mm.id]
  );

  // Update user coins if applicable
  if (mm.user_id && newCoins !== null) await db.run('UPDATE users SET coins=? WHERE id=?', [newCoins, mm.user_id]);

  const updated = await db.get('SELECT * FROM matches WHERE id=?', [mm.id]);
  return { match: await getMatchSafe(updated), message };
}

/**
 * Processes a sentence guess for a game match
 * @param {Object} params - Parameters
 * @param {number} params.matchId - Match ID
 * @param {number|null} params.userId - User ID (null for guest)
 * @param {string} params.sentence - Sentence being guessed
 * @param {boolean} params.isGuestMode - Whether this is a guest mode game
 * @returns {Object} Result with updated match and message
 */
export async function guessSentence({ matchId, userId = null, sentence, isGuestMode = false }) {
  const db = await getDb();
  const m = await db.get('SELECT * FROM matches WHERE id=?', [matchId]);
  if (!m || m.status !== 'playing') throw new Error('Match not playable');
  if ((userId ?? null) !== (m.user_id ?? null)) throw new Error('Unauthorized');

  // Check for timeout and update match status if necessary
  let mm = await closeIfTimeout(m);
  if (mm.status !== 'playing') return { match: await getMatchSafe(mm), message: 'Time over.' };

  const s = await db.get('SELECT text FROM sentences WHERE id=?', [mm.sentence_id]);
  const S = s.text.toUpperCase();
  const ok = S === sentence.toUpperCase();

  let newMask = mm.revealed_mask;
  let status = mm.status;
  let message = 'Wrong sentence. Keep trying!';

  // Handle coin rewards and status updates for correct guesses
  let newCoins = null;
  if (ok) {
    newMask = [...S].map(_ => '1').join('');  // Reveal entire sentence
    status = 'won';
    
    // Different rewards for guest vs authenticated users
    if (!isGuestMode && mm.user_id) {
      message = 'Correct sentence! You gained +100 coins!';
      const currentCoins = await getUserCoins(mm.user_id);
      newCoins = currentCoins + 100;
    } else {
      message = 'Correct sentence! Well done! 🎉';
    }
  }

  // Update match state in database
  await db.run(
    'UPDATE matches SET revealed_mask=?, status=? WHERE id=?',
    [newMask, status, mm.id]
  );
  
  // Update user coins if applicable
  if (mm.user_id && newCoins !== null) await db.run('UPDATE users SET coins=? WHERE id=?', [newCoins, mm.user_id]);

  const updated = await db.get('SELECT * FROM matches WHERE id=?', [mm.id]);
  return { match: await getMatchSafe(updated), message };
}

/**
 * Abandons a match without revealing the sentence
 * @param {Object} params - Parameters
 * @param {number} params.matchId - Match ID
 * @param {number|null} params.userId - User ID (null for guest)
 * @returns {Object} Result with updated match and message
 */
export async function abandonMatch({ matchId, userId = null }) {
  const db = await getDb();
  const m = await db.get('SELECT * FROM matches WHERE id=?', [matchId]);
  if (!m || m.status !== 'playing') throw new Error('Match not playable');
  if ((userId ?? null) !== (m.user_id ?? null)) throw new Error('Unauthorized');

  await db.run('UPDATE matches SET status="abandoned" WHERE id=?', [m.id]);
  const updated = await db.get('SELECT * FROM matches WHERE id=?', [m.id]);
  return { match: await getMatchSafe(updated), message: 'Match abandoned.' };
}