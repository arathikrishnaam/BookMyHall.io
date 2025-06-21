const { Pool } = require('pg');
require('dotenv').config();

// Ensure DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not defined in the .env file");
  process.exit(1);
}

// Initialize the connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional SSL settings (uncomment for deployment on Heroku or similar):
  // ssl: {
  //   rejectUnauthorized: false
  // }
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

module.exports = pool;
