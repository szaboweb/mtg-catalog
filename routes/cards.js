const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Router szerepe:
// - Ez az Express router kezeli a /cards útvonal alatti kéréseket (GET, POST stb.).
// - Az app.js-ben a router így van felcsatolva: app.use('/cards', cardRoutes).
// - Itt történik az adatbázis-lekérdezés és az alap validation.

// Megengedett (elvárt) mezők a `cards` táblához
const ALLOWED_FIELDS = [
  'name',
  'release_year',
  'cost',
  'type',
  'subtype',
  'ability',
  'power',
  'toughness',
  'text',
  'rarity'
];

// Listázás: GET /cards - visszaadja az összes kártyát
// GET /cards - supports pagination: ?limit=25&page=1
router.get('/', (req, res) => {
  const limitRaw = parseInt(req.query.limit, 10);
  const pageRaw = parseInt(req.query.page, 10);
  const limit = Number.isNaN(limitRaw) ? 25 : Math.max(1, Math.min(100, limitRaw));
  const page = Number.isNaN(pageRaw) ? 1 : Math.max(1, pageRaw);
  const offset = (page - 1) * limit;

  // Get total count then page of results
  db.query('SELECT COUNT(*) AS total FROM cards', (err, countRows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    const total = (countRows && countRows[0] && countRows[0].total) ? countRows[0].total : 0;
    db.query('SELECT * FROM cards ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset], (err2, rows) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ total, items: rows });
    });
  });
});

// Új rekord beszúrása: POST /cards
// Lényeg: fogadjuk a JSON body-t, csak a megengedett mezőket használjuk,
// szükség esetén konvertálunk (int mezők), alapértelmezőt adunk a `text`-nek,
// megpróbáljuk az INSERT-et, és ha az ismeretlen oszlop miatt hibázik,
// eltávolítjuk az ismeretlen oszlopokat és egyszer újrapróbáljuk.
router.post('/', (req, res) => {
  const body = req.body || {};

  // 1) Egyszerű validáció: a `name` kötelező (DB-ben NOT NULL)
  if (!body.name || String(body.name).trim() === '') {
    return res.status(400).json({ error: 'Missing required field: name' });
  }

  // 2) Csak a megengedett mezőket másoljuk át az insert objektumba
  const insertObj = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      insertObj[field] = body[field];
    }
  });

  // 3) Alapértelmezett: ha a `text` hiányzik, állítsuk 'no-text'-re
  if (!Object.prototype.hasOwnProperty.call(insertObj, 'text') || insertObj.text === null) {
    insertObj.text = 'no-text';
  }

  // 4) Szám típusok konverziója: release_year, power, toughness
  if (insertObj.release_year !== undefined && insertObj.release_year !== null) {
    const v = parseInt(insertObj.release_year, 10);
    insertObj.release_year = Number.isNaN(v) ? null : v;
  }
  if (insertObj.power !== undefined && insertObj.power !== null) {
    const v = parseInt(insertObj.power, 10);
    insertObj.power = Number.isNaN(v) ? null : v;
  }
  if (insertObj.toughness !== undefined && insertObj.toughness !== null) {
    const v = parseInt(insertObj.toughness, 10);
    insertObj.toughness = Number.isNaN(v) ? null : v;
  }

  // 5) INSERT: használjuk a parameterizált 'SET ?' formát, ami biztonságosabb
  db.query('INSERT INTO cards SET ?', insertObj, (err, result) => {
    if (err) {
      // 6) Hiba kezelése: ha az oszlop nem létezik (ER_BAD_FIELD_ERROR),
      // töröljük az ismeretlen oszlopokat és próbáljuk újra egyszer.
      if (err.code === 'ER_BAD_FIELD_ERROR' && !insertObj._retry) {
        const msg = err.sqlMessage || '';
        const matches = msg.match(/Unknown column '([^']+)' in 'field list'/g) || [];
        const offending = matches.map(m => m.replace(/Unknown column '([^']+)' in 'field list'/, '$1'));
        offending.forEach(col => delete insertObj[col]);
        insertObj._retry = true; // csak egyszer próbálkozunk újra
        return db.query('INSERT INTO cards SET ?', insertObj, (err2, result2) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ error: 'Insert error after retry' });
          }
          // 7) Ha sikerült, lekérdezzük és visszaadjuk az új sort
          db.query('SELECT * FROM cards WHERE id = ?', [result2.insertId], (err3, rows) => {
            if (err3) {
              console.error(err3);
              return res.status(500).json({ error: 'Retrieve inserted record error' });
            }
            const record = rows && rows[0] ? rows[0] : { id: result2.insertId, ...insertObj };
            return res.status(201).json(record);
          });
        });
      }
      console.error(err);
      return res.status(500).json({ error: 'Insert error' });
    }

    // 8) Sikeres beszúrás: lekérdezzük az új sort és visszaküldjük (201)
    db.query('SELECT * FROM cards WHERE id = ?', [result.insertId], (err2, rows) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ error: 'Retrieve inserted record error' });
      }
      const record = rows && rows[0] ? rows[0] : { id: result.insertId, ...insertObj };
      res.status(201).json(record);
    });
  });
});

module.exports = router;

