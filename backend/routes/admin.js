/*
// routes/admin.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth, requireRole('admin'));

// @route   GET /api/admin/bookings/pending (kept for specific use, but AdminPanel will use /all)
router.get('/bookings/pending', async (req, res) => {
  try {
    const pendingBookings = await pool.query(
      `SELECT
        b.id, b.user_id, b.title, b.description, b.date, b.start_time, b.end_time,
        b.status, b.admin_comments, b.terms_accepted, b.created_at,
        u.name AS user_name, u.email AS user_email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.status = 'pending'
       ORDER BY b.created_at ASC;`
    );
    res.json(pendingBookings.rows);
  } catch (error) {
    console.error('Error fetching pending bookings for admin:', error);
    res.status(500).json({ message: 'Server error fetching pending bookings.' });
  }
});

// @route   GET /api/admin/bookings/all
// @desc    Get ALL bookings (pending, approved, rejected) for admin view
router.get('/bookings/all', async (req, res) => {
  try {
    const allBookings = await pool.query(
      `SELECT
        b.id, b.user_id, b.title, b.description, b.date, b.start_time, b.end_time,
        b.status, b.admin_comments, b.terms_accepted, b.created_at,
        u.name AS user_name, u.email AS user_email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC;`
    );
    res.json(allBookings.rows);
  } catch (error) {
    console.error('Error fetching all bookings for admin:', error);
    res.status(500).json({ message: 'Server error fetching all bookings.' });
  }
});


// @route   PUT /api/admin/bookings/:id/approve
// @desc    Approve a booking
router.put('/bookings/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { adminComments } = req.body;

  try {
    const result = await pool.query(
      `UPDATE bookings
       SET status = 'approved', admin_comments = $2
       WHERE id = $1 AND status = 'pending' -- Only allow approval if currently pending
       RETURNING id, title, status, admin_comments;`,
      [id, adminComments]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found or not in pending status.' });
    }

    console.log(`Booking ID ${id} approved by admin.`);
    res.json({ message: 'Booking approved successfully.', booking: result.rows[0] });

  } catch (error) {
    console.error(`Error approving booking ${id}:`, error);
    res.status(500).json({ message: 'Server error approving booking.' });
  }
});

// @route   PUT /api/admin/bookings/:id/reject
// @desc    Reject/Cancel a booking (now handles pending and approved)
router.put('/bookings/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { adminComments } = req.body;

  try {
    // Fetch booking details to check time constraint and current status
    const bookingCheck = await pool.query(
      `SELECT date, start_time, status FROM bookings WHERE id = $1;`,
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const { date, start_time, status } = bookingCheck.rows[0];

    // Allow rejection/cancellation if status is 'pending' OR 'approved'
    if (status !== 'pending' && status !== 'approved') {
        return res.status(400).json({ message: `Booking status is '${status}'. Only 'pending' or 'approved' bookings can be cancelled.` });
    }

    const bookingDateTime = new Date(`${date}T${start_time}`);
    const twentyFourHoursBefore = new Date(bookingDateTime.getTime() - (24 * 60 * 60 * 1000));
    const now = new Date();

    if (now >= twentyFourHoursBefore) {
      return res.status(400).json({ message: 'Cannot cancel booking less than 24 hours before the event start time.' });
    }

    // Update status to 'rejected' (which will be displayed as 'Cancelled' on frontend)
    const result = await pool.query(
      `UPDATE bookings
       SET status = 'rejected', admin_comments = $2
       WHERE id = $1
       RETURNING id, title, status, admin_comments;`,
      [id, adminComments]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found after time check.' });
    }

    console.log(`Booking ID ${id} cancelled by admin.`);
    res.json({ message: 'Booking cancelled successfully.', booking: result.rows[0] });

  } catch (error) {
    console.error(`Error cancelling booking ${id}:`, error);
    res.status(500).json({ message: 'Server error cancelling booking.' });
  }
});

module.exports = router;

*/
// routes/admin.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth, requireRole('admin'));

// @route   GET /api/admin/bookings/pending
// @desc    Get all bookings with 'pending' status for admin approval
router.get('/bookings/pending', async (req, res) => {
  try {
    const pendingBookings = await pool.query(
      `SELECT
        b.id, b.user_id, b.club_name, b.title, b.description, b.date, b.start_time, b.end_time,
        b.status, b.admin_comments, b.terms_accepted, b.created_at,
        u.name AS user_name, u.email AS user_email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.status = 'pending'
       ORDER BY b.created_at ASC;`
    );
    res.json(pendingBookings.rows);
  } catch (error) {
    console.error('Error fetching pending bookings for admin:', error);
    res.status(500).json({ message: 'Server error fetching pending bookings.' });
  }
});

// @route   GET /api/admin/bookings/all
// @desc    Get ALL bookings (pending, approved, rejected) for admin view
router.get('/bookings/all', async (req, res) => {
  try {
    const allBookings = await pool.query(
      `SELECT
        b.id, b.user_id, b.club_name, b.title, b.description, b.date, b.start_time, b.end_time,
        b.status, b.admin_comments, b.terms_accepted, b.created_at,
        u.name AS user_name, u.email AS user_email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC;`
    );
    res.json(allBookings.rows);
  } catch (error) {
    console.error('Error fetching all bookings for admin:', error);
    res.status(500).json({ message: 'Server error fetching all bookings.' });
  }
});


// @route   PUT /api/admin/bookings/:id/approve
// @desc    Approve a booking
router.put('/bookings/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { adminComments } = req.body;

  try {
    const result = await pool.query(
      `UPDATE bookings
       SET status = 'approved', admin_comments = $2
       WHERE id = $1 AND status = 'pending'
       RETURNING id, title, status, admin_comments;`,
      [id, adminComments]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found or not in pending status.' });
    }

    console.log(`Booking ID ${id} approved by admin.`);
    res.json({ message: 'Booking approved successfully.', booking: result.rows[0] });

  } catch (error) {
    console.error(`Error approving booking ${id}:`, error);
    res.status(500).json({ message: 'Server error approving booking.' });
  }
});

// @route   PUT /api/admin/bookings/:id/reject
// @desc    Reject/Cancel a booking (now handles pending and approved)
router.put('/bookings/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { adminComments } = req.body;

  try {
    const bookingCheck = await pool.query(
      `SELECT date, start_time, status FROM bookings WHERE id = $1;`,
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const { date, start_time, status } = bookingCheck.rows[0];

    if (status !== 'pending' && status !== 'approved') {
        return res.status(400).json({ message: `Booking status is '${status}'. Only 'pending' or 'approved' bookings can be cancelled.` });
    }

    const bookingDateTime = new Date(`${date}T${start_time}`);
    const twentyFourHoursBefore = new Date(bookingDateTime.getTime() - (24 * 60 * 60 * 1000));
    const now = new Date();

    if (now >= twentyFourHoursBefore) {
      return res.status(400).json({ message: 'Cannot cancel booking less than 24 hours before the event start time.' });
    }

    const result = await pool.query(
      `UPDATE bookings
       SET status = 'rejected', admin_comments = $2
       WHERE id = $1
       RETURNING id, title, status, admin_comments;`,
      [id, adminComments]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found after time check.' });
    }

    console.log(`Booking ID ${id} cancelled by admin.`);
    res.json({ message: 'Booking cancelled successfully.', booking: result.rows[0] });

  } catch (error) {
    console.error(`Error cancelling booking ${id}:`, error);
    res.status(500).json({ message: 'Server error cancelling booking.' });
  }
});

module.exports = router;

