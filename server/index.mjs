// server/index.mjs
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import morgan from 'morgan';
import { body, param, validationResult } from 'express-validator';

import { setupPassport } from './auth.mjs';
import { initDb, getDb } from './db.mjs';
import { randomButterfly, letterCost } from './letters.mjs';
import {
  startMatch, currentMatch, getMatchSafe,
  guessLetter, guessSentence, abandonMatch, getUserCoins
} from './dao.mjs';

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';

await initDb();

/* ========= Base middleware ========= */
app.use(morgan('dev')); // logging HTTP
app.use(express.json());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', // true solo in HTTPS
    httpOnly: true
  }
}));

setupPassport();
app.use(passport.initialize());
app.use(passport.session());

/* ========= Helpers ========= */
function isLoggedIn(req, _res, next) {
  if (req.isAuthenticated()) return next();
  return next({ status: 401, message: 'Not authenticated' });
}

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ error: errors.array().map(e => e.msg).join('; ') });
}

/* ========= Auth Sessions ========= */
app.post('/api/sessions', passport.authenticate('local'), async (req, res) => {
  const coins = await getUserCoins(req.user.id);
  req.user.coins = coins;
  res.json({ id: req.user.id, username: req.user.username, coins });
});

app.get('/api/sessions/current', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  res.json(req.user);
});

app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => res.status(204).end());
});

/* ========= Register ========= */
// POST /api/users  {username, password}
app.post(
  '/api/users',
  body('username')
    .isString().trim().notEmpty().withMessage('Username required')
    .isLength({ min: 3, max: 32 }).withMessage('Username length 3-32'),
  body('password')
    .isString().withMessage('Password required')
    .isLength({ min: 3, max: 128 }).withMessage('Password length >= 3'),
  handleValidation,
  async (req, res, next) => {
    try {
      const { createUser } = await import('./users.mjs');
      const u = await createUser(req.body.username, req.body.password);
      return res.status(201).json({ id: u.id, username: u.username, coins: 100 });
    } catch (e) {
      if (e.code === 'USERNAME_TAKEN') return res.status(409).json({ error: 'Username already taken' });
      next(e);
    }
  }
);

/* ========= Utility ========= */
app.get('/api/butterfly', (_req, res) => {
  res.json(randomButterfly(10)); // 10 lettere con frequency & cost
});

// Endpoint per ottenere i costi delle lettere
app.get('/api/letters/costs', (_req, res) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const costs = {};
  letters.forEach(letter => {
    costs[letter] = letterCost(letter);
  });
  res.json(costs);
});

app.get('/api/me', isLoggedIn, async (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, coins: req.user.coins });
});

/* ========= Matches (LOGGED) ========= */
app.post('/api/matches', isLoggedIn, async (req, res, next) => {
  try {
    if (req.user.coins <= 0) return res.status(400).json({ error: 'No coins to start a match' });
    const m = await startMatch({ userId: req.user.id, guest: false });
    const db = await getDb();
    const u = await db.get('SELECT coins FROM users WHERE id=?', [req.user.id]);
    req.user.coins = u.coins;
    res.status(201).json(await getMatchSafe(m));
  } catch (e) { next(e); }
});

app.get('/api/matches/current', isLoggedIn, async (req, res, next) => {
  try {
    const m = await currentMatch(req.user.id);
    if (!m) return res.json(null);
    res.json(await getMatchSafe(m));
  } catch (e) { next(e); }
});

app.post(
  '/api/matches/:id/guess-letter',
  isLoggedIn,
  param('id').isInt().withMessage('Invalid match id'),
  body('letter')
    .isString().withMessage('Letter required')
    .isLength({ min: 1, max: 1 }).withMessage('Letter must be a single character')
    .matches(/^[A-Z]$/).withMessage('Letter must be A-Z uppercase'),
  handleValidation,
  async (req, res, next) => {
    try {
      const r = await guessLetter({ matchId: +req.params.id, userId: req.user.id, letter: req.body.letter });
      const db = await getDb();
      const u = await db.get('SELECT coins FROM users WHERE id=?', [req.user.id]);
      req.user.coins = u.coins;
      res.json(r);
    } catch (e) {
      if (e.message && (e.message.includes('Vowel') || e.message.includes('No coins')))
        return res.status(400).json({ error: e.message });
      next(e);
    }
  }
);

app.post(
  '/api/matches/:id/guess-sentence',
  isLoggedIn,
  param('id').isInt().withMessage('Invalid match id'),
  body('sentence').isString().trim().notEmpty().withMessage('Sentence required'),
  handleValidation,
  async (req, res, next) => {
    try {
      const r = await guessSentence({ matchId: +req.params.id, userId: req.user.id, sentence: req.body.sentence });
      const db = await getDb();
      const u = await db.get('SELECT coins FROM users WHERE id=?', [req.user.id]);
      req.user.coins = u.coins;
      res.json(r);
    } catch (e) { next(e); }
  }
);

app.post(
  '/api/matches/:id/abandon',
  isLoggedIn,
  param('id').isInt().withMessage('Invalid match id'),
  handleValidation,
  async (req, res, next) => {
    try {
      const r = await abandonMatch({ matchId: +req.params.id, userId: req.user.id });
      res.json(r);
    } catch (e) { next(e); }
  }
);

/* ========= Matches (GUEST) ========= */
app.post('/api/guest/matches', async (_req, res, next) => {
  try {
    const m = await startMatch({ userId: null, guest: true });
    res.status(201).json(await getMatchSafe(m));
  } catch (e) { next(e); }
});

app.get(
  '/api/guest/matches/current/:id',
  param('id').isInt().withMessage('Invalid match id'),
  handleValidation,
  async (req, res, next) => {
    try {
      const { getDb } = await import('./db.mjs');
      const db = await getDb();
      const m = await db.get('SELECT * FROM matches WHERE id=? AND user_id IS NULL', [req.params.id]);
      if (!m) return res.status(404).json({ error: 'Not found' });
      res.json(await getMatchSafe(m));
    } catch (e) { next(e); }
  }
);

app.post(
  '/api/guest/matches/:id/guess-letter',
  param('id').isInt().withMessage('Invalid match id'),
  body('letter')
    .isString().withMessage('Letter required')
    .isLength({ min: 1, max: 1 }).withMessage('Letter must be a single character')
    .matches(/^[A-Z]$/).withMessage('Letter must be A-Z uppercase'),
  handleValidation,
  async (req, res, next) => {
    try {
      const r = await guessLetter({ matchId: +req.params.id, userId: null, letter: req.body.letter });
      res.json(r);
    } catch (e) {
      if (e.message && e.message.includes('Vowel'))
        return res.status(400).json({ error: e.message });
      next(e);
    }
  }
);

app.post(
  '/api/guest/matches/:id/guess-sentence',
  param('id').isInt().withMessage('Invalid match id'),
  body('sentence').isString().trim().notEmpty().withMessage('Sentence required'),
  handleValidation,
  async (req, res, next) => {
    try {
      const r = await guessSentence({ matchId: +req.params.id, userId: null, sentence: req.body.sentence });
      res.json(r);
    } catch (e) { next(e); }
  }
);

app.post(
  '/api/guest/matches/:id/abandon',
  param('id').isInt().withMessage('Invalid match id'),
  handleValidation,
  async (req, res, next) => {
    try {
      const r = await abandonMatch({ matchId: +req.params.id, userId: null });
      res.json(r);
    } catch (e) { next(e); }
  }
);

/* ========= Error handler ========= */
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Server error';
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
});

/* ========= Boot ========= */
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
