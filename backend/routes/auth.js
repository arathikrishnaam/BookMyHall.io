/*
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const router = express.Router();

// POST /api/auth/signup - Sign up pre-approved user
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if email is pre-approved
    const preapproved = await pool.query(
      'SELECT * FROM preapproved_users WHERE email = $1',
      [email]
    );
    if (preapproved.rows.length === 0) {
      return res.status(403).json({ message: 'You are not pre-approved to sign up' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user with pre-approved role
    const user = await pool.query(
  'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
  [name, email, hashedPassword, preapproved.rows[0].role]
);


    // Generate JWT
    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login - Log in user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
*/
/*
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

//const router = express.Router();

// Updated signup route
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultRole = 'user';
    const status = 'pending';

    const user = await pool.query(
      'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, hashedPassword, defaultRole, status]
    );

    res.json({ message: 'Signup successful. Awaiting admin approval.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Updated login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.rows[0].status === 'pending') {
      return res.status(403).json({ message: 'Account pending admin approval' });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.rows[0].role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
*/
// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Ensure this path is correct for your db.js
const { auth, requireRole } = require('../middleware/auth'); // Import auth middleware

// --- User Authentication Routes ---

// @route   POST /api/auth/signup
// @desc    Register a new user (with admin approval flow)
// @access  Public
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1. Check if user already exists in 'users' table
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      // If user exists and is pending, inform them
      if (existingUser.rows[0].status === 'pending') {
        return res.status(400).json({ message: 'User with this email has already registered and is awaiting approval.' });
      }
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let userRole;
    let userStatus;
    let token = null; // Initialize token as null

    // 2. Check if the user's email is in the 'preapproved_users' table
    const preApprovedUser = await pool.query(
      'SELECT * FROM preapproved_users WHERE email = $1',
      [email]
    );

    if (preApprovedUser.rows.length > 0) {
      // Scenario 1: User is pre-approved
      const preApprovedData = preApprovedUser.rows[0];

      // Check if the pre-approved entry has already been used (if you implemented is_registered)
      if (preApprovedData.is_registered) {
        return res.status(400).json({ message: 'This pre-approved email has already been registered.' });
      }

      // Assign role and status from pre-approved data
      userRole = preApprovedData.role; // Role from preapproved_users (admin, club_leader, faculty)
      userStatus = 'approved'; // Pre-approved users are immediately approved

      // Insert into 'users' table
      const newUser = await pool.query(
        'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, status',
        [name, email, hashedPassword, userRole, userStatus]
      );

      // Update pre_approved_users to mark as registered (if you added is_registered column)
      // This part assumes you have added the 'is_registered' column to your preapproved_users table.
      await pool.query(
        'UPDATE preapproved_users SET is_registered = TRUE WHERE email = $1',
        [email]
      );

      // Generate JWT for immediate login
      token = jwt.sign(
        { id: newUser.rows[0].id, role: newUser.rows[0].role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.status(201).json({
        message: 'Signup successful. You are now logged in.',
        token: token,
        role: newUser.rows[0].role,
        status: newUser.rows[0].status // Should be 'approved'
      });

    } else {
      // Scenario 2: User is NOT pre-approved - set to 'faculty' role and 'pending' status
      userRole = 'faculty'; // Default role for non-pre-approved sign-ups
      userStatus = 'pending'; // Requires admin approval

      // Insert into 'users' table
      const newUser = await pool.query(
        'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, status',
        [name, email, hashedPassword, userRole, userStatus]
      );

      // TODO: Implement actual admin notification (e.g., send email to admin, or use a notification system)
      console.log(`New user '${email}' registered with role '${userRole}' and status '${userStatus}'. Admin approval needed.`);

      return res.status(202).json({ // 202 Accepted for pending action
        message: 'Signup successful. Your account is awaiting admin approval.',
        status: newUser.rows[0].status // Will be 'pending'
      });
    }

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists in 'users' table
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const userData = user.rows[0];

    // 2. Check user status
    if (userData.status === 'pending') {
      return res.status(403).json({ message: 'Account pending admin approval. Please wait for activation.' });
    }
    if (userData.status === 'rejected') {
      return res.status(403).json({ message: 'Account registration rejected. Please contact support.' });
    }

    // 3. Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // 4. Generate JWT token
    const token = jwt.sign(
      { id: userData.id, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.json({ token, role: userData.role });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// --- Admin User Management Routes ---

// @route   GET /api/auth/admin/users/pending
// @desc    Get all users with 'pending' status for admin approval
// @access  Private (Admin Only)
router.get('/admin/users/pending', auth, requireRole('admin'), async (req, res) => {
  try {
    const pendingUsers = await pool.query(
      "SELECT id, name, email, role, status FROM users WHERE status = 'pending' ORDER BY id ASC"
    );
    res.json(pendingUsers.rows);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ message: 'Server error fetching pending users.' });
  }
});

// @route   PUT /api/auth/admin/users/:id/approve
// @desc    Approve a user's registration
// @access  Private (Admin Only)
router.put('/admin/users/:id/approve', auth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE users SET status = 'approved' WHERE id = $1 AND status = 'pending' RETURNING id, email, name, role, status",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found or not in pending status.' });
    }

    // TODO: Implement user notification (e.g., send email to the approved user)
    console.log(`User ${result.rows[0].email} approved.`);
    res.json({ message: 'User approved successfully.', user: result.rows[0] });

  } catch (error) {
    console.error(`Error approving user ${id}:`, error);
    res.status(500).json({ message: 'Server error approving user.' });
  }
});

// @route   PUT /api/auth/admin/users/:id/reject
// @desc    Reject a user's registration
// @access  Private (Admin Only)
router.put('/admin/users/:id/reject', auth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  // Optional: You could allow admin to send a rejection reason via req.body
  // const { reason } = req.body;

  try {
    const result = await pool.query(
      "UPDATE users SET status = 'rejected' WHERE id = $1 AND status = 'pending' RETURNING id, email, name, role, status",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found or not in pending status.' });
    }

    // TODO: Implement user notification (e.g., send email to the rejected user, include reason if applicable)
    console.log(`User ${result.rows[0].email} rejected.`);
    res.json({ message: 'User rejected successfully.', user: result.rows[0] });

  } catch (error) {
    console.error(`Error rejecting user ${id}:`, error);
    res.status(500).json({ message: 'Server error rejecting user.' });
  }
});

module.exports = router;

