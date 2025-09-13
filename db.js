require('dotenv').config();
const { Pool } = require('pg');

// Replace this with your Neon connection string
const connectionString = process.env.DATABASE_URL;

// Create a new pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: true
  }
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('Connected to the database:', result.rows);
  });
});

module.exports = pool;  
