/*
console.log("DATABASE_URL:", process.env.DATABASE_URL);

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
*/

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
