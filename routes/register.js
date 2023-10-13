const express = require('express');
const router = express.Router();
const db = require('./../models/database');
var session = require('express-session');
router.use(session({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
  }));
// Get all records
router.get('/', (req, res, next) => {
  const sql = 'SELECT username, password, mobile, email FROM test';
  db.query(sql, function(err, data) {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    } else {
      return res.json(data);
    }
  });
});

// Insert a new record
router.post('/', (req, res, next) => {
  const { username, password, mobile, email } = req.body;
  const queryCheckDup = `
    SELECT username, email, mobile FROM test WHERE username = ? OR email = ? OR mobile = ?
  `;

  db.query(queryCheckDup, [username, email, mobile], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  
    const duplicateFields = [];
    result.forEach(row => {
      if (row.username === username) {
        duplicateFields.push('Username');
        console.log('Username is duplicated.');
      }
      if (row.email === email) {
        duplicateFields.push('Email');
        console.log('Email is duplicated.');
      }
      if (row.mobile === mobile) {
        duplicateFields.push('Mobile');
        console.log('Mobile is duplicated.');
      }
    });
  
    if (duplicateFields.length > 0) {
      return res.status(400).json({ error: 'Duplicate entry for ' + duplicateFields.join(', ') });
    }
  
    const insertQuery = 'INSERT INTO test (username, password, mobile, email) VALUES (?, ?, ?, ?)';
    db.query(insertQuery, [username, password, mobile, email], (insertErr, insertResult) => {
      if (insertErr) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      return res.status(201).json({ message: 'Record inserted successfully.' });
    });
  });
});

module.exports = router;
