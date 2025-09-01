require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

app.use(cors());
app.use(express.json());

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function(err) {
    if (err) return res.status(400).json({ error: 'User already exists' });
    const token = jwt.sign({ userId: this.lastID }, process.env.JWT_SECRET || 'fallback_secret');
    res.json({ token });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback_secret');
    res.json({ token });
  });
});

app.get('/api/tasks', auth, (req, res) => {
  db.all('SELECT * FROM tasks WHERE user_id = ?', [req.userId], (err, tasks) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(tasks);
  });
});

app.post('/api/tasks', auth, (req, res) => {
  const { title } = req.body;
  db.run('INSERT INTO tasks (title, user_id) VALUES (?, ?)', [title, req.userId], function(err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ id: this.lastID, title, completed: false });
  });
});

app.put('/api/tasks/:id', auth, (req, res) => {
  const { title, completed } = req.body;
  db.run('UPDATE tasks SET title = ?, completed = ? WHERE id = ? AND user_id = ?', 
    [title, completed, req.params.id, req.userId], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ success: true });
  });
});

app.delete('/api/tasks/:id', auth, (req, res) => {
  db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ success: true });
  });
});

module.exports = app;