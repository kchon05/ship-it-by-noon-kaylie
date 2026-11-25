const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const sql = require('mssql');

const app = express();
const port = process.env.PORT || 3000;
const webDirectory = path.join(__dirname, '..', 'web');
const cafeQuery = fs.readFileSync(path.join(__dirname, '..', 'db', 'queries.sql'), 'utf8');

const connectionConfig = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: true },
};

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(connectionConfig).catch((error) => {
      poolPromise = undefined;
      throw error;
    });
  }
  return poolPromise;
}

function parseJsonArray(value, columnName) {
  if (typeof value !== 'string') {
    throw new Error(`The ${columnName} column did not contain JSON text.`);
  }
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error(`The ${columnName} query result was not an array.`);
  }
  return parsed;
}

app.get('/api/cafes', async (request, response) => {
  const neighborhood = request.query.neighborhood;
  if (typeof neighborhood !== 'string' || !neighborhood.trim() || neighborhood.length > 80) {
    return response.status(400).json({ error: 'Choose a starting neighborhood.' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('neighborhood', sql.NVarChar(80), neighborhood.trim())
      .query(cafeQuery);
    const cafes = result.recordset.map((row) => {
      const { crowd_json, transit_json, ...cafe } = row;
      return {
        ...cafe,
        crowd: parseJsonArray(crowd_json, 'crowd'),
        transit: parseJsonArray(transit_json, 'transit'),
      };
    });
    response.json({ cafes });
  } catch (error) {
    console.error('Could not load cafe listings from SQL Server:', error);
    response.status(500).json({
      error: 'Could not load cafe listings. Check that the database is loaded and reachable.',
    });
  }
});

app.use(express.static(webDirectory));

app.listen(port, () => {
  console.log(`Study cafe finder is running at http://localhost:${port}`);
});
