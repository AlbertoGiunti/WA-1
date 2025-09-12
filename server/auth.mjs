import passport from 'passport';
import LocalStrategy from 'passport-local';
import crypto from 'crypto';
import { getDb } from './db.mjs';

function verifyPassword(password, salt, hash) {
  const h = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'));
}

export function setupPassport() {
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const db = await getDb();
      const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      if (!user) return done(null, false, { message: 'Invalid credentials' });
      if (!verifyPassword(password, user.salt, user.password_hash))
        return done(null, false, { message: 'Invalid credentials' });
      return done(null, { id: user.id, username: user.username });
    } catch (err) { return done(err); }
  }));

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      const db = await getDb();
      const u = await db.get('SELECT id, username, coins FROM users WHERE id=?', [id]);
      if (!u) return done(null, false);
      done(null, { id: u.id, username: u.username, coins: u.coins });
    } catch (e) { done(e); }
  });

  return passport;
}

