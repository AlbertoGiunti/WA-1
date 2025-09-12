import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';

export const dbPromise = open({ filename: './game.db', driver: sqlite3.Database });

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export async function initDb() {
  const db = await dbPromise;

  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      coins INTEGER NOT NULL DEFAULT 100
    );

    CREATE TABLE IF NOT EXISTS sentences(
      id INTEGER PRIMARY KEY,
      text TEXT NOT NULL,
      is_guest INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS matches(
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      sentence_id INTEGER NOT NULL,
      started_at INTEGER NOT NULL,
      ends_at INTEGER NOT NULL,
      status TEXT NOT NULL,
      revealed_mask TEXT NOT NULL,
      guessed_letters TEXT NOT NULL,
      used_vowel INTEGER NOT NULL DEFAULT 0,
      remaining_coins INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(sentence_id) REFERENCES sentences(id)
    );
  `);

  const cntUsers = (await db.get('SELECT COUNT(*) as c FROM users')).c;
  if (cntUsers === 0) {
    const seed = [
      { username: 'testuser150', coins: 150, password: 'pwd' },
      { username: 'testuser0', coins: 0,    password: 'pwd' },
      { username: 'testuser45', coins: 45,  password: 'pwd' }
    ];
    for (const u of seed) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = hashPassword(u.password, salt);
      await db.run(
        'INSERT INTO users(username, salt, password_hash, coins) VALUES (?,?,?,?)',
        [u.username, salt, hash, u.coins]
      );
    }
  }

  const cntSent = (await db.get('SELECT COUNT(*) as c FROM sentences')).c;
  if (cntSent === 0) {
    const normal = [
      'PRACTICE MAKES PERFECT ONLY WITH FEEDBACK',
      'EVERY PUZZLE STARTS SIMPLE THEN TURNS TRICKY',
      'KEEP CALM AND CODE YOUR WAY TO VICTORY',
      'LOGIC IS THE ART OF MAKING GOOD GUESSES',
      'SHORT STEPS BUILD LONG AND LASTING JOURNEYS',
      'NOTHING GREAT COMES WITHOUT SMALL FAILURES',
      'DEBUGGING IS TWICE AS HARD AS CODING',
      'TESTS HELP YOU TRUST WHAT YOU CANNOT SEE',
      'FOCUS BEATS TALENT WHEN TALENT IS UNFOCUSED',
      'CHOOSE CLARITY OVER CLEVERNESS EVERY TIME',
      'GOOD NAMES EXPLAIN WHAT CODE ACTUALLY DOES',
      'YOUR FUTURE IS BUILT ONE COMMIT AT A TIME',
      'MOVE SLOW WHEN YOU WANT TO MOVE FAST',
      'PRACTICE PATIENCE PRECISION AND PERSISTENCE',
      'TODAY IS A GOOD DAY TO LEARN SOMETHING',
      'ASSUMPTIONS ARE THE MOTHER OF ALL MISTAKES',
      'READING CODE IS HARDER THAN WRITING CODE',
      'CLEAN CODE IS LIKE A WELL TOLD STORY',
      'SIMPLE IS NOT EASY BUT ALWAYS WORTH IT',
      'GREAT SOFTWARE IS BUILT BY GREAT HABITS'
    ];
    const guest = [
      'GUESS THE SENTENCE WITHOUT ANY COINS',
      'THREE SECRET PHRASES AWAIT THE BRAVE',
      'PLAY FOR FUN AND LEARN THE RULES HERE'
    ];
    for (const t of normal) await db.run('INSERT INTO sentences(text,is_guest) VALUES (?,0)', [t]);
    for (const t of guest)  await db.run('INSERT INTO sentences(text,is_guest) VALUES (?,1)', [t]);
  }
}

export async function getDb() { return dbPromise; }
