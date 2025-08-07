// routes/admin.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const { sendBookingApprovalToUser, sendBookingRejectionToUser } = require('../utils/mailer');

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
// @desc    Get ALL bookings (pending, approved, rejected, cancelled) for admin view
router.get('/bookings/all', async (req, res) => {
  try {
    const allBookings = await pool.query(
      `SELECT
        b.id, b.user_id, b.club_name, b.title, b.description, b.date, b.start_time, b.end_time,
        b.status, b.admin_comments, b.terms_accepted, b.created_at, b.updated_at,
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

// @route   GET /api/admin/bookings/stats
// @desc    Get booking statistics for admin dashboard
router.get('/bookings/stats', async (req, res) => {
  try {
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_bookings,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
       FROM bookings;`
    );
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ message: 'Server error fetching booking statistics.' });
  }
});

// @route   PUT /api/admin/bookings/:id/approve
// @desc    Approve a booking
router.put('/bookings/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { adminComments } = req.body;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Get booking details including user info before updating
    const bookingDetailsResult = await client.query(
      `SELECT
        b.id, b.title, b.date, b.start_time, b.end_time, b.club_name, b.description,
        u.email AS user_email, u.name AS user_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1 AND b.status = 'pending';`,
      [id]
    );

    if (bookingDetailsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        message: 'Booking not found or not in pending status.' 
      });
    }

    const bookingToApprove = bookingDetailsResult.rows[0];

    // Check for any conflicting approved bookings
    const BUFFER_MINUTES = 60;
    const conflictCheck = await client.query(
      `SELECT id, title, club_name FROM bookings
       WHERE date = $1 AND status = 'approved' AND id != $2
       AND (
           ( (start_time + date) < ($4::TIME + $1::DATE + INTERVAL '${BUFFER_MINUTES} minutes') )
           AND
           ( (end_time + date) > ($3::TIME + $1::DATE - INTERVAL '${BUFFER_MINUTES} minutes') )
       );`,
      [bookingToApprove.date, id, bookingToApprove.start_time, bookingToApprove.end_time]
    );

    if (conflictCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        message: 'Cannot approve: This time slot conflicts with an already approved booking.',
        conflictingBookings: conflictCheck.rows
      });
    }

    // Update booking status to approved
    const updateResult = await client.query(
      `UPDATE bookings
       SET status = 'approved', admin_comments = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending'
       RETURNING id, title, status, admin_comments;`,
      [id, adminComments]
    );

    await client.query('COMMIT');
    console.log(`✅ Booking ID ${id} approved by admin.`);

    // Send approval email to user
    try {
      await sendBookingApprovalToUser(bookingToApprove, adminComments);
      console.log(`✅ User approval notification sent for booking ${id}.`);
    } catch (emailError) {
      console.error(`❌ Failed to send approval email for booking ${id}:`, emailError);
      // Don't block the approval if email fails
    }

    res.json({ 
      message: 'Booking approved successfully.', 
      booking: updateResult.rows[0] 
    });

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error(`Error approving booking ${id}:`, error);
    res.status(500).json({ message: 'Server error approving booking.' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// @route   PUT /api/admin/bookings/:id/reject
// @desc    Reject/Cancel a booking (handles pending and approved bookings)
router.put('/bookings/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { adminComments } = req.body;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Get booking details including user info before updating
    const bookingDetailsResult = await client.query(
      `SELECT
        b.id, b.title, b.date, b.start_time, b.end_time, b.status, b.club_name, b.description,
        u.email AS user_email, u.name AS user_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1;`,
      [id]
    );

    if (bookingDetailsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const bookingToReject = bookingDetailsResult.rows[0];
    const { date, start_time, status } = bookingToReject;

    // Check if booking can be cancelled
    if (status !== 'pending' && status !== 'approved') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: `Booking status is '${status}'. Only 'pending' or 'approved' bookings can be cancelled.` 
      });
    }

    // Check 24-hour cancellation policy for approved bookings
    if (status === 'approved') {
      const bookingDateTime = new Date(`${date}T${start_time}`);
      const twentyFourHoursBefore = new Date(bookingDateTime.getTime() - (24 * 60 * 60 * 1000));
      const now = new Date();

      if (now >= twentyFourHoursBefore) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: 'Cannot cancel approved booking less than 24 hours before the event start time.' 
        });
      }
    }

    // Update booking status to rejected
    const updateResult = await client.query(
      `UPDATE bookings
       SET status = 'rejected', admin_comments = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, title, status, admin_comments;`,
      [id, adminComments]
    );

    await client.query('COMMIT');
    console.log(`✅ Booking ID ${id} rejected/cancelled by admin.`);

    // Send rejection email to user
    try {
      await sendBookingRejectionToUser(bookingToReject, adminComments);
      console.log(`✅ User rejection notification sent for booking ${id}.`);
    } catch (emailError) {
      console.error(`❌ Failed to send rejection email for booking ${id}:`, emailError);
      // Don't block the rejection if email fails
    }

    res.json({ 
      message: 'Booking cancelled successfully.', 
      booking: updateResult.rows[0] 
    });

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error(`Error cancelling booking ${id}:`, error);
    res.status(500).json({ message: 'Server error cancelling booking.' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// @route   GET /api/admin/bookings/:id
// @desc    Get a specific booking details for admin
router.get('/bookings/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const booking = await pool.query(
      `SELECT
        b.id, b.user_id, b.club_name, b.title, b.description, b.date, b.start_time, b.end_time,
        b.status, b.admin_comments, b.terms_accepted, b.created_at, b.updated_at,
        u.name AS user_name, u.email AS user_email, u.role AS user_role
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1;`,
      [id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.json(booking.rows[0]);
  } catch (error) {
    console.error(`Error fetching booking ${id}:`, error);
    res.status(500).json({ message: 'Server error fetching booking details.' });
  }
});


// 🚨 TEMPORARY ROUTE: Insert a single admin user into 'users' table
// Access via: GET /api/admin/insert-temp-admin
router.get('/insert-temp-admin', async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO users (id, name, email, password, role, approval_status, created_at)
      VALUES (
        1,
        'CGPU',
        'seminarhall.lbs@gmail.com',
        'lbsseminarhall',
        'admin',
        'approved',
        '2025-07-16 20:57:03.907085+05:30'
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    res.send('✅ Temporary admin user inserted.');
  } catch (error) {
    console.error('❌ Error inserting admin user:', error.message);
    res.status(500).send('Failed to insert admin user.');
  }
});

module.exports = router;
