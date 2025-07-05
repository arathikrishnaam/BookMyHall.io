/*
const express = require('express');
const pool = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/admin/bookings - Get all pending bookings (admin only)
router.get('/bookings', auth, requireRole(['admin']), async (req, res) => {
  try {
    const bookings = await pool.query('SELECT * FROM bookings WHERE status = $1', ['pending']);
    res.json(bookings.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/bookings/:id - Approve or reject a booking (admin only)
router.patch('/bookings/:id', auth, requireRole(['admin']), async (req, res) => {
  const { status, comments } = req.body;
  const { id } = req.params;

  // Validate status
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const booking = await pool.query(
      'UPDATE bookings SET status = $1, admin_comments = $2 WHERE id = $3 RETURNING *',
      [status, comments, id]
    );
    if (booking.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
*/

// routes/admin.js
const express = require('express');
const pool = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Middleware to ensure only admins can access these routes
// This applies 'auth' and 'requireRole('admin')' to all routes defined below this line in this router.
router.use(auth, requireRole('admin'));

// @route   GET /api/admin/bookings/pending
// @desc    Get all bookings with 'pending' status for admin approval
// @access  Private (Admin Only)
// Frontend calls this via getPendingBookings() -> /api/admin/bookings/pending
router.get('/bookings/pending', async (req, res) => {
  try {
    // Fetch bookings that are in 'pending' status, joining with users to get requester's details
    const pendingBookings = await pool.query(
      `SELECT
        b.id,
        b.user_id,
        b.title,
        b.description,
        b.date,
        b.start_time,
        b.end_time,
        b.status,
        b.admin_comments,
        b.terms_accepted,
        b.created_at,
        u.name AS user_name,
        u.email AS user_email
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

// @route   PUT /api/admin/bookings/:id/approve
// @desc    Approve a booking
// @access  Private (Admin Only)
// Frontend calls this via approveBooking(id, comments)
router.put('/bookings/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { adminComments } = req.body; // Optional: admin can add comments

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

    // TODO: Implement notification to the user whose booking was approved
    console.log(`Booking ID ${id} approved by admin.`);
    res.json({ message: 'Booking approved successfully.', booking: result.rows[0] });

  } catch (error) {
    console.error(`Error approving booking ${id}:`, error);
    res.status(500).json({ message: 'Server error approving booking.' });
  }
});

// @route   PUT /api/admin/bookings/:id/reject
// @desc    Reject a booking
// @access  Private (Admin Only)
// Frontend calls this via rejectBooking(id, comments)
router.put('/bookings/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { adminComments } = req.body; // Optional: admin can add comments/reason

  try {
    const result = await pool.query(
      `UPDATE bookings
       SET status = 'rejected', admin_comments = $2
       WHERE id = $1 AND status = 'pending'
       RETURNING id, title, status, admin_comments;`,
      [id, adminComments]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found or not in pending status.' });
    }

    // TODO: Implement notification to the user whose booking was rejected
    console.log(`Booking ID ${id} rejected by admin.`);
    res.json({ message: 'Booking rejected successfully.', booking: result.rows[0] });

  } catch (error) {
    console.error(`Error rejecting booking ${id}:`, error);
    res.status(500).json({ message: 'Server error rejecting booking.' });
  }
});

module.exports = router;



