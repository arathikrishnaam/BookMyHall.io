// createAdmin.js
const bcrypt = require('bcrypt');
const pool = require('./config/db'); // adjust path if needed

const createOrUpdateAdmin = async () => {
  const name = 'CGPU';
  const email = 'seminarhall.lbs@gmail.com';
  const plainPassword = 'lbsseminarhall';
  const role = 'admin';
  const status = 'approved';

  try {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email)
       DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, status = EXCLUDED.status
       RETURNING *`,
      [name, email, hashedPassword, role, status]
    );

    console.log('✅ Admin created/updated:', result.rows[0]);
  } catch (err) {
    console.error('❌ Error inserting/updating admin:', err.message);
  } finally {
    await pool.end(); // close DB connection
  }
};

createOrUpdateAdmin();
