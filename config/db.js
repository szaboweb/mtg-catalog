require('dotenv').config();
const mysql = require('mysql');
const util = require('util');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Track connection status and expose helpers
db.isConnected = false;
db.queryAsync = util.promisify(db.query).bind(db);

// Reconnect logic (simple exponential backoff)
let connectAttempts = 0;
function tryConnect() {
  db.connect(err => {
    if (err) {
      connectAttempts += 1;
      const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(connectAttempts, 5)));
      console.error(`DB connection error (attempt ${connectAttempts}):`, err && err.message ? err.message : err);
      db.isConnected = false;
      console.log(`Retrying DB connection in ${delay}ms`);
      setTimeout(tryConnect, delay);
      return;
    }
    connectAttempts = 0;
    db.isConnected = true;
    console.log('Database connected successfully');
  });
}

tryConnect();

db.on('error', (err) => {
  console.error('Database error event:', err && err.message ? err.message : err);
  db.isConnected = false;
  // Try to reconnect after a short delay
  setTimeout(() => {
    tryConnect();
  }, 2000);
});

module.exports = db;

