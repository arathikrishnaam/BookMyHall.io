const bcrypt = require('bcrypt');
const pool = require('./config/db');

const createOrUpdateAdmin = async () => {
  const name = 'CGPU';
  const email = 'seminarhall.lbs@gmail.com';
  const plainPassword = 'lbsseminarhall';
  const role = 'admin';
  const status = 'approved';

  try {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const existing = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      // Update existing admin
      const updated = await pool.query(
        `UPDATE users 
         SET password = $1, name = $2, role = $3, status = $4
         WHERE email = $5
         RETURNING *`,
        [hashedPassword, name, role, status, email]
      );
      console.log('✅ Admin updated:', updated.rows[0]);
    } else {
      // Create new admin
      const created = await pool.query(
        `INSERT INTO users (name, email, password, role, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, email, hashedPassword, role, status]
      );
      console.log('✅ Admin created:', created.rows[0]);
    }
  } catch (err) {
    console.error('❌ Error inserting/updating admin:', err.message);
  } finally {
    pool.end();
  }
};

createOrUpdateAdmin();
