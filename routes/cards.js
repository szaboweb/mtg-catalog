const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Listázás
router.get('/', (req, res) => {
  db.query('SELECT * FROM Cards', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Új rekord beszúrása
router.post('/', (req, res) => {
  db.query('INSERT INTO Cards SET ?', req.body, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Insert error' });
    }
    res.json({ id: result.insertId, ...req.body });
  });
});

module.exports = router;

