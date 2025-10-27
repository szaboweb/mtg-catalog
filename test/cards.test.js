/* eslint-disable no-undef */
const request = require('supertest');
const { expect } = require('chai');

// We'll stub the DB module before requiring the app
const path = require('path');
const dbPath = path.join(__dirname, '..', 'config', 'db.js');

function makeStubDb() {
  const db = {
    isConnected: true,
    query: (sql, params, cb) => {
      // Normalize args: params optional
      if (typeof params === 'function') {
        cb = params; params = [];
      }
      // Simulate COUNT
      if (/COUNT\(\*\) AS total/.test(sql)) {
        return cb(null, [{ total: 2 }]);
      }
      if (/SELECT \* FROM cards ORDER BY id DESC LIMIT/.test(sql)) {
        return cb(null, [ { id: 2, name: 'B' }, { id: 1, name: 'A' } ]);
      }
      if (/INSERT INTO cards SET \?/.test(sql)) {
        return cb(null, { insertId: 7 });
      }
      if (/SELECT \* FROM cards WHERE id = \?/.test(sql)) {
        return cb(null, [ { id: params[0], name: 'Inserted', text: 'no-text' }]);
      }
      return cb(null, []);
    }
  };
  
  // Add queryAsync as a promisified version of query
  db.queryAsync = function(sql, params) {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  };
  
  return db;
}

describe('Cards routes (unit)', () => {
  let app;
  before(() => {
    // Inject stub into require cache
    const stub = makeStubDb();
    require.cache[require.resolve('../config/db.js')] = { exports: stub };
    app = require('../app');
  });

  it('GET /cards should return paginated structure', async () => {
    const res = await request(app).get('/cards');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('total');
    expect(res.body).to.have.property('items');
    expect(res.body.items).to.be.an('array');
  });

  it('POST /cards without name should return 400', async () => {
    const res = await request(app)
      .post('/cards')
      .send({});
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('POST /cards should insert and default text to no-text', async () => {
    const res = await request(app)
      .post('/cards')
      .send({ name: 'New card' });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('id');
    expect(res.body).to.have.property('text');
    expect(res.body.text).to.equal('no-text');
  });
});
