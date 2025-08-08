/*
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not defined in the .env file");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL database');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  });

module.exports = pool;
*/

const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not defined in the .env file");
  process.exit(1);
}

// Check if the environment is production (e.g., on Render)
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add this SSL configuration for Render
  ssl: isProduction ? {
    rejectUnauthorized: false
  } : false, // Disable SSL for local dev
});

pool.connect()
  .then(async (client) => {
    console.log('✅ Connected to PostgreSQL database');
    try {
      const res = await client.query('SELECT current_database();');
      console.log('🧠 Connected to DB:', res.rows[0].current_database);
    } finally {
      client.release(); // Always release the client after use
    }
  })
  .catch((err) => {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  });

module.exports = pool;