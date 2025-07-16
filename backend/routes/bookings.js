// routes/bookings.js
const express = require('express');
const pool = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const moment = require('moment-timezone');
const { sendBookingNotificationToAdmin } = require('../utils/mailer');

const router = express.Router();

// POST /api/bookings - Create a new booking (club_leader or faculty)
router.post('/', auth, requireRole(['club_leader', 'faculty']), async (req, res) => {
  const { club_name, title, description, date, startTime, endTime, termsAccepted } = req.body;
  const userId = req.user.id;
  const userEmail = req.user.email;
  const userName = req.user.name;

  console.log('--- Booking Creation Debug ---');
  console.log('Incoming booking request body:', req.body);
  console.log('User ID from token:', userId);

  // Validation
  if (!club_name || !title || !date || !startTime || !endTime || termsAccepted === undefined) {
    console.error('Validation Error: Missing required fields.');
    return res.status(400).json({ 
      message: 'Please enter all required fields: Club Name, Title, Date, Start Time, End Time, and accept terms.' 
    });
  }
  
  if (!termsAccepted) {
    console.error('Validation Error: Terms not accepted.');
    return res.status(400).json({ 
      message: 'You must accept the terms and conditions.' 
    });
  }

  // Time validation
  const newBookingStartMoment = moment.tz(`${date}T${startTime}`, 'YYYY-MM-DDTHH:mm', 'Asia/Kolkata');
  const newBookingEndMoment = moment.tz(`${date}T${endTime}`, 'YYYY-MM-DDTHH:mm', 'Asia/Kolkata');

  if (newBookingStartMoment.isSameOrAfter(newBookingEndMoment)) {
    console.error('Validation Error: End time is not after start time.');
    return res.status(400).json({ 
      message: 'End time must be after start time.' 
    });
  }

  // Check if booking date is in the future
  if (newBookingStartMoment.isBefore(moment())) {
    return res.status(400).json({ 
      message: 'Booking date and time must be in the future.' 
    });
  }

  const BUFFER_MINUTES = 60;
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Check for overlapping bookings
    const overlapCheckQuery = `
      SELECT id, title, start_time, end_time, club_name FROM bookings
      WHERE date = $1 AND status IN ('approved', 'pending')
      AND (
          ( (start_time + date) < ($3::TIME + $1::DATE + INTERVAL '${BUFFER_MINUTES} minutes') )
          AND
          ( (end_time + date) > ($2::TIME + $1::DATE - INTERVAL '${BUFFER_MINUTES} minutes') )
      );
    `;

    const conflictingBookings = await client.query(overlapCheckQuery, [date, startTime, endTime]);

    if (conflictingBookings.rows.length > 0) {
      await client.query('ROLLBACK');
      console.error('Overlap detected:', conflictingBookings.rows);
      return res.status(409).json({
        message: `The selected time slot overlaps with an existing approved or pending booking (including 60-minute buffer). Please choose another time.`,
        conflictingBookings: conflictingBookings.rows
      });
    }

    // Insert the new booking
    const insertQuery = `
      INSERT INTO bookings (user_id, club_name, title, description, date, start_time, end_time, terms_accepted, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
    `;
    const insertValues = [userId, club_name, title, description, date, startTime, endTime, termsAccepted, 'pending'];

    console.log('Executing INSERT query:');
    console.log('Query string:', insertQuery);
    console.log('Values array:', insertValues);

    const result = await client.query(insertQuery, insertValues);
    const newBooking = result.rows[0];

    await client.query('COMMIT');
    console.log('Booking created successfully:', newBooking);

    // Send email notification to admin
    try {
      await sendBookingNotificationToAdmin(
        {
          club_name,
          title,
          description,
          date,
          start_time: startTime,
          end_time: endTime
        },
        {
          name: userName,
          email: userEmail
        }
      );
      console.log('✅ Admin notification email sent successfully.');
    } catch (emailError) {
      console.error('❌ Failed to send admin notification email:', emailError);
      // Don't block the booking creation if email fails
    }

    res.status(201).json({
      message: 'Booking created successfully! Admin has been notified and will review your request.',
      booking: newBooking
    });

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error creating booking:', error);
    res.status(500).json({ 
      message: 'Server error while creating booking. Please try again.' 
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// GET /api/bookings - Get user's bookings
router.get('/', auth, requireRole(['club_leader', 'faculty']), async (req, res) => {
  try {
    const bookings = await pool.query(
      `SELECT id, club_name, title, description, date, start_time, end_time, status, admin_comments, created_at 
       FROM bookings 
       WHERE user_id = $1 
       ORDER BY created_at DESC`, 
      [req.user.id]
    );
    res.json(bookings.rows);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error fetching bookings.' });
  }
});

// GET /api/bookings/public - Get approved bookings for public calendar
router.get('/public', async (req, res) => {
  try {
    const bookings = await pool.query(
      `SELECT id, club_name, title, description, date, start_time, end_time, status 
       FROM bookings 
       WHERE status = $1 AND date >= CURRENT_DATE 
       ORDER BY date ASC, start_time ASC`, 
      ['approved']
    );
    res.json(bookings.rows);
  } catch (error) {
    console.error('Error fetching public bookings:', error);
    res.status(500).json({ message: 'Server error fetching public bookings.' });
  }
});

// PUT /api/bookings/:id - Update a booking (only pending bookings can be updated)
router.put('/:id', auth, requireRole(['club_leader', 'faculty']), async (req, res) => {
  const { id } = req.params;
  const { club_name, title, description, date, startTime, endTime, termsAccepted } = req.body;
  const userId = req.user.id;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Check if booking exists and belongs to user
    const existingBooking = await client.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingBooking.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (existingBooking.rows[0].status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Only pending bookings can be updated.' 
      });
    }

    // If date/time is being updated, check for conflicts
    if (date || startTime || endTime) {
      const newDate = date || existingBooking.rows[0].date;
      const newStartTime = startTime || existingBooking.rows[0].start_time;
      const newEndTime = endTime || existingBooking.rows[0].end_time;

      const BUFFER_MINUTES = 60;
      const overlapCheckQuery = `
        SELECT id, title, start_time, end_time FROM bookings
        WHERE date = $1 AND status IN ('approved', 'pending') AND id != $4
        AND (
            ( (start_time + date) < ($3::TIME + $1::DATE + INTERVAL '${BUFFER_MINUTES} minutes') )
            AND
            ( (end_time + date) > ($2::TIME + $1::DATE - INTERVAL '${BUFFER_MINUTES} minutes') )
        );
      `;

      const conflictingBookings = await client.query(overlapCheckQuery, [newDate, newStartTime, newEndTime, id]);

      if (conflictingBookings.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          message: `The updated time slot overlaps with an existing booking. Please choose another time.`,
          conflictingBookings: conflictingBookings.rows
        });
      }
    }

    // Update the booking
    const result = await client.query(
      `UPDATE bookings
       SET club_name = COALESCE($1, club_name),
           title = COALESCE($2, title),
           description = COALESCE($3, description),
           date = COALESCE($4, date),
           start_time = COALESCE($5, start_time),
           end_time = COALESCE($6, end_time),
           terms_accepted = COALESCE($7, terms_accepted),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *;`,
      [club_name, title, description, date, startTime, endTime, termsAccepted, id, userId]
    );

    await client.query('COMMIT');

    res.json({ 
      message: 'Booking updated successfully.', 
      booking: result.rows[0] 
    });

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error(`Error updating booking ${id}:`, error);
    res.status(500).json({ message: 'Server error updating booking.' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// DELETE /api/bookings/:id - Cancel a booking (user can only cancel their own pending bookings)
router.delete('/:id', auth, requireRole(['club_leader', 'faculty']), async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING *;`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Booking not found or cannot be cancelled.' 
      });
    }

    res.json({ 
      message: 'Booking cancelled successfully.', 
      booking: result.rows[0] 
    });

  } catch (error) {
    console.error(`Error cancelling booking ${id}:`, error);
    res.status(500).json({ message: 'Server error cancelling booking.' });
  }
});

module.exports = router;