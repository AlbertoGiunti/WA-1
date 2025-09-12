import dayjs from 'dayjs';
import { getDb } from './db.mjs';
import { letterCost } from './letters.mjs';

const MATCH_SECONDS = 60;
const TIME_PENALTY = 20;

function buildMask(sentenceU) {
  return [...sentenceU].map(ch => ch === ' ' ? '1' : '0').join('');
}

function revealMask(sentenceU, mask, letterU) {
  const arr = mask.split('');
  for (let i = 0; i < sentenceU.length; i++) {
    if (sentenceU[i] === letterU) arr[i] = '1';
  }
  return arr.join('');
}

function isAllRevealed(mask, sentenceU) {
  for (let i = 0; i < mask.length; i++) {
    if (sentenceU[i] !== ' ' && mask[i] === '0') return false;
  }
  return true;
}

export async function getUserCoins(userId) {
  const db = await getDb();
  const u = await db.get('SELECT coins FROM users WHERE id=?', [userId]);
  return u?.coins ?? 0;
}

export async function currentMatch(userId) {
  const db = await getDb();
  const m = await db.get(
    'SELECT * FROM matches WHERE user_id IS ? AND status="playing" ORDER BY id DESC LIMIT 1',
    [userId ?? null]
  );
  return m || null;
}

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

  let remaining = null;
  if (!guest && userId) {
    const coins = await getUserCoins(userId);
    remaining = coins;
  }

  const res = await db.run(
    `INSERT INTO matches(user_id, sentence_id, started_at, ends_at, status, revealed_mask, guessed_letters, used_vowel, remaining_coins)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [userId, row.id, now.unix(), ends.unix(), 'playing', mask, '', 0, remaining]
  );
  return await db.get('SELECT * FROM matches WHERE id=?', [res.lastID]);
}

async function closeIfTimeout(m) {
  const db = await getDb();
  const now = dayjs().unix();
  if (m.status !== 'playing') return m;
  if (now <= m.ends_at) return m;

  if (m.user_id) {
    const penalty = Math.min(TIME_PENALTY, m.remaining_coins ?? 0);
    const newCoins = Math.max(0, (m.remaining_coins ?? 0) - penalty);
    await db.run('UPDATE users SET coins=? WHERE id=?', [newCoins, m.user_id]);
    await db.run('UPDATE matches SET status="lost", remaining_coins=? WHERE id=?', [newCoins, m.id]);
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
    if (ch === ' ') return ' ';                             // spazi sempre ' '
    return m.revealed_mask[i] === '1' ? ch : null;          // lettera rivelata vs non rivelata
  });

   // A fine partita puoi mostrare tutta la frase
  const fullSentence = (m.status !== 'playing') ? sentenceU : null;

  const result = {
    id: m.id,
    status: m.status,
    endsAt: m.ends_at,
    revealedMask: m.revealed_mask,
    guessedLetters: m.guessed_letters.split('').filter(Boolean),
    usedVowel: !!m.used_vowel,
    remainingCoins: m.remaining_coins,
    spaces: [...sentenceU].map(ch => ch === ' '),
    revealed,
    fullSentence
  };
  
  return result;
}

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

  let newCoins = mm.remaining_coins;
  if (mm.user_id) {
    if ((newCoins ?? 0) <= 0) throw new Error('No coins');
    newCoins = Math.max(0, (newCoins ?? 0) - effectiveCost);
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
    `UPDATE matches SET revealed_mask=?, guessed_letters=?, used_vowel=?, status=?, remaining_coins=?
     WHERE id=?`,
    [newMask, newGuessed, (mm.used_vowel || isVowel) ? 1 : 0, status, newCoins, mm.id]
  );

  if (mm.user_id) await db.run('UPDATE users SET coins=? WHERE id=?', [newCoins, mm.user_id]);

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
  let newCoins = mm.remaining_coins;
  let status = mm.status;
  let message = 'Wrong sentence. Keep trying!';

  if (ok) {
    newMask = [...S].map(_ => '1').join('');
    status = 'won';
    message = 'Correct sentence! +100 coins if logged in.';
    if (mm.user_id) newCoins = (newCoins ?? 0) + 100;
  }

  await db.run(
    'UPDATE matches SET revealed_mask=?, status=?, remaining_coins=? WHERE id=?',
    [newMask, status, newCoins, mm.id]
  );
  if (mm.user_id) await db.run('UPDATE users SET coins=? WHERE id=?', [newCoins, mm.user_id]);

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
