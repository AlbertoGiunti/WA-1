// imports
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';

// init express
const app = new express();
const port = 3002;

// middleware
app.use(cors({
  origin: [
    'http://localhost:3000',  // React default
    'http://localhost:5173',  // Vite default  
    'http://localhost:5174',  // Vite alternative
    'http://127.0.0.1:5173',  // Alternative localhost
    'http://127.0.0.1:5174'   // Alternative localhost
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

app.use(session({
  secret: 'guess-sentence-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Database setup
const db = new sqlite3.Database('game.db', (err) => {
  if (err) console.error(err.message);
  console.log('Connected to the SQLite database.');
});

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    salt TEXT NOT NULL,
    coins INTEGER DEFAULT 100
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    sentence TEXT NOT NULL,
    guessed_letters TEXT DEFAULT '',
    vowel_used BOOLEAN DEFAULT FALSE,
    coins_spent INTEGER DEFAULT 0,
    start_time INTEGER,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
  
  // Delete existing users without salt (cleanup for new salt-based authentication)
  db.run(`DELETE FROM users WHERE salt IS NULL`, (err) => {
    if (err) {
      console.error('Error cleaning up users without salt:', err.message);
    } else {
      console.log('Cleaned up users without salt');
    }
  });
});

// Letter frequencies and costs
const letterCosts = {
  // Vowels (10 coins each)
  'A': 10, 'E': 10, 'I': 10, 'O': 10, 'U': 10,
  // Consonants by frequency (5 coins for most frequent, down to 1 for least)
  'T': 5, 'N': 5, 'S': 5, 'H': 5, 'R': 5,
  'D': 4, 'L': 4, 'C': 4, 'M': 4, 'W': 4,
  'F': 3, 'G': 3, 'Y': 3, 'P': 3, 'B': 3,
  'V': 2, 'K': 2, 'J': 2, 'X': 2, 'Q': 1, 'Z': 1
};

const vowels = ['A', 'E', 'I', 'O', 'U'];

// Sentences for the game
const sentences = [
  "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG",
  "LEARNING NEW THINGS KEEPS THE MIND VERY SHARP",
  "NEVER STOP DREAMING BIG AND CHASING YOUR GOALS",
  "HAPPINESS GROWS WHEN SHARED WITH OTHER PEOPLE",
  "THE STARS SHINE BRIGHT IN THE MIDNIGHT SKY",
  "SMALL STEPS EVERY DAY LEAD TO GREAT SUCCESS",
  "READING A GOOD BOOK IS LIKE TRAVELING THE WORLD",
  "MUSIC HAS THE POWER TO HEAL THE HUMAN SOUL",
  "ALWAYS BELIEVE IN YOURSELF AND YOUR ABILITIES",
  "PATIENCE AND PRACTICE MAKE EVERY SKILL BETTER"
];

// Guest sentences (simpler for non-logged users)
const guestSentences = [
  "HELLO WORLD THIS IS A SIMPLE GAME",
  "WELCOME TO THE GUESS SENTENCE CHALLENGE",
  "PRACTICE MAKES PERFECT IN THIS GAME"
];

// Authentication function with salt
const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) { 
        reject(err); 
      }
      else if (row === undefined) { 
        resolve(false); 
      }
      else {
        const user = {id: row.id, username: row.username, coins: row.coins};
        
        const salt = row.salt;
        crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
          if (err) reject(err);
          if(!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword))
            resolve(false);
          else 
            resolve(user);
        });
      }
    });
  });
};

// Passport configuration
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await getUser(username, password);
    if (!user) {
      return done(null, false, { message: 'Invalid username or password' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
};

// Routes

// Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Generate random salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Hash password with salt using crypto.scrypt
    crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: 'Server error during password hashing' });
      }
      
      // Convert hashedPassword to hex string
      const passwordHex = hashedPassword.toString('hex');
      
      db.run('INSERT INTO users (username, password, salt) VALUES (?, ?, ?)', 
             [username, passwordHex, salt], 
             function(err) {
               if (err) {
                 if (err.message.includes('UNIQUE constraint failed')) {
                   return res.status(400).json({ error: 'Username already exists' });
                 }
                 return res.status(500).json({ error: 'Server error' });
               }
               res.json({ message: 'User registered successfully' });
             });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info.message });
    
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          coins: user.coins 
        } 
      });
    });
  })(req, res, next);
});

// Logout
app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
app.get('/api/user', isAuthenticated, (req, res) => {
  // Fetch fresh user data from database to ensure current coin balance
  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        coins: user.coins || 0  // Ensure coins is never null/undefined
      } 
    });
  });
});

// Start new match
app.post('/api/match/start', isAuthenticated, (req, res) => {
  if (req.user.coins <= 0) {
    return res.status(400).json({ error: 'Not enough coins to start a match' });
  }
  
  const sentence = sentences[Math.floor(Math.random() * sentences.length)];
  console.log(sentence)
  const startTime = Date.now();
  
  db.run('INSERT INTO matches (user_id, sentence, start_time) VALUES (?, ?, ?)',
         [req.user.id, sentence, startTime],
         function(err) {
           if (err) return res.status(500).json({ error: 'Failed to start match' });
           
           // Return only the structure (letters as underscores, spaces preserved)
           const structure = sentence.split('').map(char => 
             char === ' ' ? ' ' : '_'
           ).join('');
           
           res.json({ 
             matchId: this.lastID,
             structure,
             timeRemaining: 60
           });
         });
});

// Start guest match
app.post('/api/match/guest', (req, res) => {
  const sentence = guestSentences[Math.floor(Math.random() * guestSentences.length)];
  
  // For guests, we'll store match in session
  req.session.guestMatch = {
    sentence,
    guessedLetters: '',
    startTime: Date.now()
  };
  
  const structure = sentence.split('').map(char => 
    char === ' ' ? ' ' : '_'
  ).join('');
  
  res.json({ 
    structure,
    timeRemaining: 60,
    isGuest: true
  });
});

// Get letter costs
app.get('/api/letters/costs', (req, res) => {
  res.json(letterCosts);
});

// Get random letters (Butterfly component)
app.get('/api/letters/random', (req, res) => {
  const letters = Object.keys(letterCosts);
  const randomLetters = [];
  
  while (randomLetters.length < 10) {
    const letter = letters[Math.floor(Math.random() * letters.length)];
    if (!randomLetters.some(l => l.letter === letter)) {
      randomLetters.push({
        letter,
        frequency: letterCosts[letter]
      });
    }
  }
  
  res.json(randomLetters);
});

// Guess letter
app.post('/api/match/:id/guess-letter', isAuthenticated, (req, res) => {
  const { letter } = req.body;
  const matchId = req.params.id;
  const upperLetter = letter.toUpperCase();
  
  db.get('SELECT * FROM matches WHERE id = ? AND user_id = ? AND status = "active"',
         [matchId, req.user.id], 
         (err, match) => {
           if (err) return res.status(500).json({ error: 'Database error' });
           if (!match) return res.status(404).json({ error: 'Match not found' });
           
           // Check if time is up
           if (Date.now() - match.start_time > 60000) {
             return res.status(400).json({ error: 'Time is up' });
           }
           
           // Check if letter already guessed
           if (match.guessed_letters.includes(upperLetter)) {
             return res.status(400).json({ error: 'Letter already guessed' });
           }
           
           // Check vowel constraint
           if (vowels.includes(upperLetter) && match.vowel_used) {
             return res.status(400).json({ error: 'Only one vowel allowed per match' });
           }
           
           const cost = letterCosts[upperLetter] || 1;
           const isInSentence = match.sentence.includes(upperLetter);
           const finalCost = isInSentence ? cost : cost * 2;
           
           // Check if user has enough coins
           if (req.user.coins < finalCost) {
             return res.status(400).json({ error: 'Not enough coins' });
           }
           
           const newGuessedLetters = match.guessed_letters + upperLetter;
           const newVowelUsed = match.vowel_used || vowels.includes(upperLetter);
           const newCoinsSpent = match.coins_spent + finalCost;
           
           // Update match
           db.run(`UPDATE matches SET 
                     guessed_letters = ?, 
                     vowel_used = ?, 
                     coins_spent = ? 
                   WHERE id = ?`,
                  [newGuessedLetters, newVowelUsed, newCoinsSpent, matchId]);
           
           // Update user coins
           db.run('UPDATE users SET coins = coins - ? WHERE id = ?',
                  [finalCost, req.user.id]);
           
           // Generate current structure
           const structure = match.sentence.split('').map(char => {
             if (char === ' ') return ' ';
             return newGuessedLetters.includes(char) ? char : '_';
           }).join('');
           
           res.json({
             structure,
             letterFound: isInSentence,
             cost: finalCost,
             coinsRemaining: req.user.coins - finalCost
           });
         });
});

// Guess letter (guest)
app.post('/api/match/guest/guess-letter', (req, res) => {
  const { letter } = req.body;
  const upperLetter = letter.toUpperCase();
  
  if (!req.session.guestMatch) {
    return res.status(404).json({ error: 'No active guest match' });
  }
  
  const match = req.session.guestMatch;
  
  // Check if time is up
  if (Date.now() - match.startTime > 60000) {
    return res.status(400).json({ error: 'Time is up' });
  }
  
  // Check if letter already guessed
  if (match.guessedLetters.includes(upperLetter)) {
    return res.status(400).json({ error: 'Letter already guessed' });
  }
  
  const isInSentence = match.sentence.includes(upperLetter);
  match.guessedLetters += upperLetter;
  
  // Generate current structure
  const structure = match.sentence.split('').map(char => {
    if (char === ' ') return ' ';
    return match.guessedLetters.includes(char) ? char : '_';
  }).join('');
  
  res.json({
    structure,
    letterFound: isInSentence
  });
});

// Guess sentence
app.post('/api/match/:id/guess-sentence', isAuthenticated, (req, res) => {
  const { sentence } = req.body;
  const matchId = req.params.id;
  
  db.get('SELECT * FROM matches WHERE id = ? AND user_id = ? AND status = "active"',
         [matchId, req.user.id], 
         (err, match) => {
           if (err) return res.status(500).json({ error: 'Database error' });
           if (!match) return res.status(404).json({ error: 'Match not found' });
           
           if (sentence.toUpperCase() === match.sentence) {
             // Won!
             db.run('UPDATE matches SET status = "won" WHERE id = ?', [matchId]);
             db.run('UPDATE users SET coins = coins + 100 WHERE id = ?', [req.user.id]);
             
             res.json({
               success: true,
               message: 'Congratulations! You won 100 coins!',
               correctSentence: match.sentence,
               coinsEarned: 100
             });
           } else {
             res.json({
               success: false,
               message: 'Incorrect sentence. Try again!'
             });
           }
         });
});

// Guess sentence (guest)
app.post('/api/match/guest/guess-sentence', (req, res) => {
  const { sentence } = req.body;
  
  if (!req.session.guestMatch) {
    return res.status(404).json({ error: 'No active guest match' });
  }
  
  const match = req.session.guestMatch;
  
  if (sentence.toUpperCase() === match.sentence) {
    res.json({
      success: true,
      message: 'Congratulations! You guessed correctly!',
      correctSentence: match.sentence
    });
  } else {
    res.json({
      success: false,
      message: 'Incorrect sentence. Try again!'
    });
  }
});

// Get guest game timeout status
app.get('/api/match/guest/timeout', (req, res) => {
  if (!req.session.guestMatch) {
    return res.status(404).json({ error: 'No active guest match' });
  }
  
  const match = req.session.guestMatch;
  const timeElapsed = Date.now() - match.startTime;
  
  if (timeElapsed >= 60000) {
    res.json({
      status: 'timeout',
      correctSentence: match.sentence
    });
  } else {
    res.json({
      status: 'active',
      timeRemaining: Math.ceil((60000 - timeElapsed) / 1000)
    });
  }
});

// Abandon match
app.post('/api/match/:id/abandon', isAuthenticated, (req, res) => {
  const matchId = req.params.id;
  
  db.get('SELECT * FROM matches WHERE id = ? AND user_id = ? AND status = "active"',
         [matchId, req.user.id], 
         (err, match) => {
           if (err) return res.status(500).json({ error: 'Database error' });
           if (!match) return res.status(404).json({ error: 'Match not found' });
           
           db.run('UPDATE matches SET status = "abandoned" WHERE id = ?', [matchId]);
           
           res.json({
             message: 'Match abandoned',
             correctSentence: match.sentence
           });
         });
});

// Check match timeout
app.get('/api/match/:id/status', isAuthenticated, (req, res) => {
  const matchId = req.params.id;
  
  // First get current user data to ensure we have the latest coin balance
  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, currentUser) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!currentUser) return res.status(404).json({ error: 'User not found' });
    
    db.get('SELECT * FROM matches WHERE id = ? AND user_id = ?',
           [matchId, req.user.id], 
           (err, match) => {
             if (err) return res.status(500).json({ error: 'Database error' });
             if (!match) return res.status(404).json({ error: 'Match not found' });
             
             const timeElapsed = Date.now() - match.start_time;
             const timeRemaining = Math.max(0, 60000 - timeElapsed);
             
             if (timeRemaining === 0 && match.status === 'active') {
               // Time up - apply penalty using current user coins
               const penalty = Math.min(20, currentUser.coins);
               db.run('UPDATE matches SET status = "timeout" WHERE id = ?', [matchId]);
               db.run('UPDATE users SET coins = coins - ? WHERE id = ?', [penalty, req.user.id]);
               
               return res.json({
                 status: 'timeout',
                 correctSentence: match.sentence,
                 penalty,
                 newCoinBalance: currentUser.coins - penalty,
                 message: `Time's up! You lost ${penalty} coins. The correct sentence was revealed.`
               });
             }
             
             res.json({
               status: match.status,
               timeRemaining: Math.ceil(timeRemaining / 1000)
             });
           });
  });
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// "We're painting the roses red, we're painting the roses red" - Alice in Wonderland