require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Auth middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function(err) {
      if (err) {
        console.log('Register error:', err);
        return res.status(400).json({ error: 'User already exists' });
      }
      const token = jwt.sign({ userId: this.lastID }, process.env.JWT_SECRET);
      res.json({ token });
    });
  } catch (error) {
    console.log('Register catch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.log('Login DB error:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
      res.json({ token });
    });
  } catch (error) {
    console.log('Login catch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Task routes
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));