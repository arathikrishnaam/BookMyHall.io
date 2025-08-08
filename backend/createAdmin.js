// createAdmin.js
const bcrypt = require('bcrypt');
const { pool } = require('./config/db'); // adjust path if db.js is elsewhere

const createAdmin = async () => {
  const name = 'CGPU';
  const email = 'seminarhall.lbs@gmail.com';
  const plainPassword = 'lbsseminarhall'; // set the password you want
  const role = 'admin';
  const status = 'approved';

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Insert into users table
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, status`,
      [name, email, hashedPassword, role, status]
    );

    console.log('✅ Admin created successfully:');
    console.table(result.rows);
    console.log(`\nYou can now log in with:\nEmail: ${email}\nPassword: ${plainPassword}`);
  } catch (err) {
    console.error('❌ Error inserting admin:', err.message);
  } finally {
    pool.end(); // close DB connection
  }
};

createAdmin();
