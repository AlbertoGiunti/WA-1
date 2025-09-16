/**
 * Authentication setup using Passport.js
 * Configures local strategy for username/password authentication
 */

import passport from 'passport';
import LocalStrategy from 'passport-local';
import { findByUsername, getById, verifyPassword } from '../dao/users.mjs';

/**
 * Sets up Passport.js authentication with local strategy
 * @returns {Object} Configured passport instance
 */
export function setupPassport() {
  passport.use(new LocalStrategy(async (username, password, done) => {  // done = CallBack
    try {
      const user = await findByUsername(username);
      if (!user) return done(null, false, { message: 'Invalid credentials' });  // null => no errors
      
      if (!verifyPassword(password, user.salt, user.password_hash))
        return done(null, false, { message: 'Invalid credentials' });
      
      return done(null, { id: user.id, username: user.username });
    } catch (err) { 
      return done(err); 
    }
  }));

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      const u = await getById(id);
      if (!u) return done(null, false);
      done(null, { id: u.id, username: u.username, coins: u.coins });
    } catch (e) { 
      done(e);   // !null => error
    }
  });

  return passport;
}