const express = require('express');
const router = express.Router();
const db = require('./../models/database');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const { authenToken } = require('./Middleware');

require('dotenv').config();

// Register
router.post('/register', (req, res) => {
  const { username, password, mobile, email } = req.body;

  const queryCheckDup = 'SELECT * FROM users WHERE username = ? OR email = ? OR mobile = ?';

  db.query(queryCheckDup, [username, email, mobile], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const duplicateFields = [];
    result.forEach(row => {
      if (row.username === username) {
        duplicateFields.push('Username');
        console.log('dup : username');
      }
      if (row.email === email) {
        duplicateFields.push('Email');
        console.log('dup : email');
      }
      if (row.mobile === mobile) {
        duplicateFields.push('Mobile');
        console.log('dup : mobile');
      }
    });

    if (duplicateFields.length > 0) {
      return res.status(400).json({ error: 'Duplicate entry for ' + duplicateFields.join(', ') });
    }

    const insertQuery = 'INSERT INTO users (username, password, mobile, email) VALUES (?, ?, ?, ?)';
    db.query(insertQuery, [username, password, mobile, email], (insertErr, insertResult) => {
      if (insertErr) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      return res.status(201).json({ message: 'Record inserted successfully.' });
    });
  });
});

//login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    const payload = {
      email: user.email,
      username: user.username,
    };

    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    console.log(token);

    res.json({ token });
  });
});

module.exports = router;
