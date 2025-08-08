const { pool } = require('./config/db'); // Adjust if your db file is in a different folder

const createAdmin = async () => {
  const name = 'CGPU';
  const email = 'seminarhall.lbs@gmail.com';
  const hashedPassword = '$2b$10$wWo1S2gFxdtuQctG/6ExFeyIA/TrF9c2yM6rZ16ypPRJXIV073eY2';
  const role = 'admin';
  const status = 'approved';

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, hashedPassword, role, status]
    );

    console.log('✅ Admin created:', result.rows[0]);
  } catch (err) {
    console.error('❌ Error inserting admin:', err.message);
  } finally {
    process.exit();
  }
};

createAdmin();
