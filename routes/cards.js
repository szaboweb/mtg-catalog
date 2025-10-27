const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ===================================
// Helper Functions
// ===================================

// Allowed fields for INSERT operations
const ALLOWED_FIELDS = [
  'name', 'release_year', 'cost', 'type', 'subtype', 
  'ability', 'power', 'toughness', 'text', 'rarity'
];

/**
 * Build insert object from request body with only allowed fields
 */
function buildInsertObj(body) {
  const obj = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      obj[field] = body[field];
    }
  });
  
  // Set default value for text if not provided
  if (!Object.prototype.hasOwnProperty.call(obj, 'text') || obj.text === null) {
    obj.text = 'no-text';
  }
  
  return obj;
}

/**
 * Coerce numeric fields to integers
 */
function coerceInts(obj) {
  ['release_year', 'power', 'toughness'].forEach((field) => {
    if (obj[field] !== undefined && obj[field] !== null) {
      const value = parseInt(obj[field], 10);
      obj[field] = Number.isNaN(value) ? null : value;
    }
  });
}

/**
 * Parse unknown column names from MySQL error message
 */
function parseUnknownColumns(errorMessage) {
  if (!errorMessage) return [];
  const matches = errorMessage.match(/Unknown column '([^']+)' in 'field list'/g) || [];
  return matches.map(m => m.replace(/Unknown column '([^']+)' in 'field list'/, '$1'));
}

// ===================================
// Routes
// ===================================

/**
 * GET /cards
 * Retrieve all cards with optional pagination
 * Query params: limit (default: 25), page (default: 1)
 * Returns: { total: number, items: array }
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 25;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db.queryAsync('SELECT COUNT(*) AS total FROM cards');
    const total = countResult[0].total;

    // Get paginated cards
    const cards = await db.queryAsync(
      'SELECT * FROM cards ORDER BY id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json({
      total: total,
      items: cards
    });
  } catch (err) {
    console.error('GET /cards error:', err);
    res.status(500).json({ error: 'Failed to retrieve cards' });
  }
});

/**
 * POST /cards
 * Create a new card
 * Body: { name (required), release_year, cost, type, subtype, ability, power, toughness, text, rarity }
 * Returns: Created card object with 201 status
 */
router.post('/', async (req, res) => {
  const body = req.body || {};

  // Validation: name is required (NOT NULL in DB)
  if (!body.name || String(body.name).trim() === '') {
    return res.status(400).json({ error: 'Missing required field: name' });
  }

  // Build insert object with only allowed fields
  const insertObj = buildInsertObj(body);
  
  // Coerce numeric fields to integers
  coerceInts(insertObj);

  try {
    // Attempt INSERT
    const result = await db.queryAsync('INSERT INTO cards SET ?', insertObj);
    
    // Retrieve the inserted record
    const rows = await db.queryAsync('SELECT * FROM cards WHERE id = ?', [result.insertId]);
    const record = (rows && rows[0]) ? rows[0] : { id: result.insertId, ...insertObj };
    
    return res.status(201).json(record);
  } catch (err) {
    // Handle unknown column errors by retrying without offending columns
    if (err && err.code === 'ER_BAD_FIELD_ERROR') {
      const errorMessage = err.sqlMessage || err.message || '';
      const offendingColumns = parseUnknownColumns(errorMessage);
      
      if (offendingColumns.length > 0) {
        console.warn('Unknown columns detected, retrying without:', offendingColumns);
        
        // Remove offending columns
        offendingColumns.forEach(col => delete insertObj[col]);
        
        try {
          const retryResult = await db.queryAsync('INSERT INTO cards SET ?', insertObj);
          const retryRows = await db.queryAsync('SELECT * FROM cards WHERE id = ?', [retryResult.insertId]);
          const retryRecord = (retryRows && retryRows[0]) ? retryRows[0] : { id: retryResult.insertId, ...insertObj };
          
          return res.status(201).json(retryRecord);
        } catch (retryErr) {
          console.error('POST /cards retry error:', retryErr);
          return res.status(500).json({ error: 'Insert failed after retry' });
        }
      }
    }
    
    // Generic error handling
    console.error('POST /cards error:', err);
    return res.status(500).json({ 
      error: 'Failed to insert card',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
