const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cardRoutes = require('./routes/cards');
const db = require('./config/db');

require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Serve static frontend files from /public
app.use(express.static('public'));

// Check if frontpage exists; provide a friendly fallback if not
const indexPath = path.join(__dirname, 'public', 'index.html');
if (fs.existsSync(indexPath)) {
  app.get('/', (req, res) => res.sendFile(indexPath));
} else {
  console.warn('Warning: public/index.html not found. Serving fallback message.');
  app.get('/', (req, res) => res.status(503).send('<h1>Frontend not available</h1><p>The frontpage is missing on the server.</p>'));
}

// Lightweight status endpoint for healthchecks and debugging
app.get('/status', (req, res) => {
  const frontend = fs.existsSync(indexPath);
  const database = !!(db && db.isConnected);
  res.json({ frontendAvailable: frontend, databaseAvailable: database });
});

// Short-circuit /cards requests when DB is unavailable to return 503 quickly
app.use('/cards', (req, res, next) => {
  if (!db || !db.isConnected) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  next();
}, cardRoutes);

// Generic 404 handler for other static/missing resources
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).send('<h1>Not found</h1><p>Resource not found on the server.</p>');
  }
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3300;

// Export app for testing. Start server only when run directly.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
    if (!db || !db.isConnected) {
      console.warn('Database is not connected. /cards endpoints will return 503 until connection is available.');
    }
  });
}

module.exports = app;

