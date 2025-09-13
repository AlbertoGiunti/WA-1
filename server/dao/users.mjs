/**
 * Data Access Object for user-related database operations
 * Contains all SQL queries and user management functions
 */

import crypto from 'crypto';
import { getDb } from '../db.mjs';

/**
 * Hashes a password using scrypt with a salt
 * @param {string} password - Plain text password
 * @param {string} salt - Salt for hashing
 * @returns {string} Hashed password
 */
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * Creates a new user in the database
 * @param {string} username - Username
 * @param {string} password - Plain text password
 * @returns {Object} Created user object
 * @throws {Error} If username already exists
 */
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

/**
 * Finds a user by username for authentication
 * @param {string} username - Username to search for
 * @returns {Object|null} User object with salt and password_hash or null if not found
 */
export async function findByUsername(username) {
  const db = await getDb();
  return await db.get('SELECT * FROM users WHERE username=?', [username]);
}

/**
 * Finds a user by ID
 * @param {number} id - User ID to search for
 * @returns {Object|null} User object or null if not found
 */
export async function getById(id) {
  const db = await getDb();
  return await db.get('SELECT * FROM users WHERE id=?', [id]);
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
 * Updates a user's coin balance
 * @param {number} userId - User ID
 * @param {number} newCoins - New coin amount
 */
export async function updateUserCoins(userId, newCoins) {
  const db = await getDb();
  await db.run('UPDATE users SET coins=? WHERE id=?', [newCoins, userId]);
}

/**
 * Verifies a password against the stored hash
 * @param {string} password - Plain text password
 * @param {string} salt - Stored salt
 * @param {string} storedHash - Stored password hash
 * @returns {boolean} True if password is correct
 */
export function verifyPassword(password, salt, storedHash) {
  const hash = hashPassword(password, salt);
  return hash === storedHash;
}