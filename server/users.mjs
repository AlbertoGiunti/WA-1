import crypto from 'crypto';
import { getDb } from './db.mjs';

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export async function createUser(username, password) {
  const db = await getDb();
  const exists = await db.get('SELECT id FROM users WHERE username = ?', [username]);
  if (exists) {
    const err = new Error('Username already taken');
    err.code = 'USERNAME_TAKEN';
    throw err;
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const password_hash = hashPassword(password, salt);
  const res = await db.run(
    'INSERT INTO users(username, salt, password_hash, coins) VALUES (?,?,?,?)',
    [username, salt, password_hash, 100]
  );
  return { id: res.lastID, username };
}
