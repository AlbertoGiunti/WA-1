// imports
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import session from 'express-session';

// init express
const app = express();
const port = 3002;

// init database
const db = new sqlite3.Database('game.db');

// middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true }
}));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    req.user = { id: req.session.userId };
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// Match timeout endpoint - ESSENTIAL for your requirement
app.post('/api/match/:id/timeout', isAuthenticated, (req, res) => {
  const matchId = req.params.id;
  
  // Get current user data to calculate penalty
  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, currentUser) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!currentUser) return res.status(404).json({ error: 'User not found' });
    
    db.get('SELECT * FROM matches WHERE id = ? AND user_id = ? AND status = "active"',
           [matchId, req.user.id], 
           (err, match) => {
             if (err) return res.status(500).json({ error: 'Database error' });
             if (!match) return res.status(404).json({ error: 'Match not found' });
             
             // Apply penalty: 20 coins or all remaining coins if less than 20
             const penalty = Math.min(20, currentUser.coins);
             const newBalance = Math.max(0, currentUser.coins - penalty);
             
             // Update match status and user coins
             db.run('UPDATE matches SET status = "timeout" WHERE id = ?', [matchId]);
             db.run('UPDATE users SET coins = ? WHERE id = ?', [newBalance, req.user.id]);
             
             res.json({
               message: `Time's up! You lost ${penalty} coins. The correct sentence was revealed.`,
               correctSentence: match.sentence,
               penalty,
               newCoinBalance: newBalance
             });
           });
  });
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});