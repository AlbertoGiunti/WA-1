import dayjs from 'dayjs';
import { getDb } from './db.mjs';
import { letterCost } from './letters.mjs';

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
 * Gets the current coin balance for a user
 * @param {number} userId - User ID
 * @returns {number} Current coin balance
 */
export async function getUserCoins(userId) {
  const db = await getDb();
  const u = await db.get('SELECT coins FROM users WHERE id=?', [userId]);
  return u?.coins ?? 0;
}

/**
 * Gets the currently active match for a user or guest
 * @param {number|null} userId - User ID (null for guest)
 * @returns {Object|null} Active match object or null
 */
export async function currentMatch(userId) {
  const db = await getDb();
  const m = await db.get(
    'SELECT * FROM matches WHERE user_id IS ? AND status="playing" ORDER BY id DESC LIMIT 1',
    [userId ?? null]
  );
  return m || null;
}

/**
 * Starts a new game match for a user or guest
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
  console.log(sentenceU);
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
  if (m.status !== 'playing') return m;
  if (now <= m.ends_at) return m;

  if (m.user_id) {
    // Get current user coins from the users table
    const currentCoins = await getUserCoins(m.user_id);
    const penalty = Math.min(TIME_PENALTY, currentCoins);
    const newCoins = Math.max(0, currentCoins - penalty);
    
    await db.run('UPDATE users SET coins=? WHERE id=?', [newCoins, m.user_id]);
    await db.run('UPDATE matches SET status="lost" WHERE id=?', [m.id]);
  } else {
    await db.run('UPDATE matches SET status="lost" WHERE id=?', [m.id]);
  }
  return await db.get('SELECT * FROM matches WHERE id=?', [m.id]);
}

export async function getMatchSafe(m) {
  const db = await getDb();
  m = await closeIfTimeout(m);
  const s = await db.get('SELECT text FROM sentences WHERE id=?', [m.sentence_id]);
  const sentenceU = s.text.toUpperCase();

  const revealed = [...sentenceU].map((ch, i) => {
    if (ch === ' ') return null;                             // spaces always null
    return m.revealed_mask[i] === '1' ? ch : null;          // revealed letter vs not revealed
  });

   // At the end of the game you can show the complete sentence
  const fullSentence = (m.status !== 'playing') ? sentenceU : null;

  const result = {
    id: m.id,
    status: m.status,
    endsAt: m.ends_at,
    revealedMask: m.revealed_mask,
    guessedLetters: m.guessed_letters.split('').filter(Boolean),
    usedVowel: !!m.used_vowel,
    //remainingCoins: m.remaining_coins,
    spaces: [...sentenceU].map(ch => ch === ' '),
    revealed,
    sentence: fullSentence  /* Usa 'sentence' invece di "fullSentence" per il frontend */
  };
  
  return result;
}

/**
 * Processes a letter guess for a game match
 * @param {Object} params - Parameters
 * @param {number} params.matchId - Match ID
 * @param {number|null} params.userId - User ID (null for guest)
 * @param {string} params.letter - Letter being guessed
 * @returns {Object} Result with updated match and message
 */
export async function guessLetter({ matchId, userId = null, letter }) {
  const db = await getDb();
  const m = await db.get('SELECT * FROM matches WHERE id=?', [matchId]);
  if (!m || m.status !== 'playing') throw new Error('Match not playable');
  if ((userId ?? null) !== (m.user_id ?? null)) throw new Error('Unauthorized');

  let mm = await closeIfTimeout(m);
  if (mm.status !== 'playing') return { match: await getMatchSafe(mm), message: 'Time over.' };

  const L = letter.toUpperCase();
  const isVowel = 'AEIOU'.includes(L);
  if (isVowel && mm.used_vowel) throw new Error('Vowel already used in this match.');

  const s = await db.get('SELECT text FROM sentences WHERE id=?', [mm.sentence_id]);
  const S = s.text.toUpperCase();

  const cost = letterCost(L);
  const present = S.includes(L);
  const effectiveCost = (present ? cost : cost * 2);

  // Coin management - get current user coins
  let newCoins = null;
  if (mm.user_id) {
    const currentCoins = await getUserCoins(mm.user_id);
    if (currentCoins <= 0) throw new Error('No coins');
    newCoins = Math.max(0, currentCoins - effectiveCost);
  }

  let newMask = mm.revealed_mask;
  if (present) newMask = revealMask(S, newMask, L);

  const won = isAllRevealed(newMask, S);
  let status = mm.status;
  let message = present ? 'Letter revealed.' : 'Letter not present (cost doubled).';

  if (won) {
    status = 'won';
    message = 'You guessed all letters!';
    if (mm.user_id) newCoins = (newCoins ?? 0) + 100;
  }

  const newGuessed = (mm.guessed_letters + L)
    .split('').filter((v,i,a)=>a.indexOf(v)===i).join('');

  await db.run(
    `UPDATE matches SET revealed_mask=?, guessed_letters=?, used_vowel=?, status=?
     WHERE id=?`,
    [newMask, newGuessed, (mm.used_vowel || isVowel) ? 1 : 0, status, mm.id]
  );

  if (mm.user_id && newCoins !== null) await db.run('UPDATE users SET coins=? WHERE id=?', [newCoins, mm.user_id]);

  const updated = await db.get('SELECT * FROM matches WHERE id=?', [mm.id]);
  return { match: await getMatchSafe(updated), message };
}

export async function guessSentence({ matchId, userId = null, sentence }) {
  const db = await getDb();
  const m = await db.get('SELECT * FROM matches WHERE id=?', [matchId]);
  if (!m || m.status !== 'playing') throw new Error('Match not playable');
  if ((userId ?? null) !== (m.user_id ?? null)) throw new Error('Unauthorized');

  let mm = await closeIfTimeout(m);
  if (mm.status !== 'playing') return { match: await getMatchSafe(mm), message: 'Time over.' };

  const s = await db.get('SELECT text FROM sentences WHERE id=?', [mm.sentence_id]);
  const S = s.text.toUpperCase();
  const ok = S === sentence.toUpperCase();

  let newMask = mm.revealed_mask;
  let status = mm.status;
  let message = 'Wrong sentence. Keep trying!';

  // Coin management - get current user coins
  let newCoins = null;
  if (ok) {
    newMask = [...S].map(_ => '1').join('');
    status = 'won';
    message = 'Correct sentence! You gained +100 coins!';
    if (mm.user_id) {
      const currentCoins = await getUserCoins(mm.user_id);
      newCoins = currentCoins + 100;
    }
  }

  await db.run(
    'UPDATE matches SET revealed_mask=?, status=? WHERE id=?',
    [newMask, status, mm.id]
  );
  if (mm.user_id && newCoins !== null) await db.run('UPDATE users SET coins=? WHERE id=?', [newCoins, mm.user_id]);

  const updated = await db.get('SELECT * FROM matches WHERE id=?', [mm.id]);
  return { match: await getMatchSafe(updated), message };
}

export async function abandonMatch({ matchId, userId = null }) {
  const db = await getDb();
  const m = await db.get('SELECT * FROM matches WHERE id=?', [matchId]);
  if (!m || m.status !== 'playing') throw new Error('Match not playable');
  if ((userId ?? null) !== (m.user_id ?? null)) throw new Error('Unauthorized');

  await db.run('UPDATE matches SET status="abandoned" WHERE id=?', [m.id]);
  const updated = await db.get('SELECT * FROM matches WHERE id=?', [m.id]);
  return { match: await getMatchSafe(updated), message: 'Match abandoned.' };
}
