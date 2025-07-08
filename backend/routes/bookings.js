/*
// routes/bookings.js
const express = require('express');
const pool = require('../config/db'); // Assuming this correctly imports your PostgreSQL pool
const { auth, requireRole } = require('../middleware/auth'); // Your authentication middleware
const router = express.Router();

// Make sure you have installed moment-timezone: npm install moment-timezone
const moment = require('moment-timezone'); // For robust date/time handling

// POST /api/bookings - Create a new booking (club_leader or faculty)
router.post('/', auth, requireRole(['club_leader', 'faculty']), async (req, res) => {
  // Destructure club_name from req.body
  const { club_name, title, description, date, startTime, endTime, termsAccepted } = req.body;
  const userId = req.user.id; // User ID from your authentication middleware

  // Debugging: Log incoming request body
  console.log('--- Booking Creation Debug ---');
  console.log('Incoming booking request body:', req.body);
  console.log('User ID from token:', userId);

  // 1. Basic Validation (Client-side validation should also be in place)
  if (!club_name || !title || !date || !startTime || !endTime || termsAccepted === undefined) {
    console.error('Validation Error: Missing required fields.');
    return res.status(400).json({ message: 'Please enter all required fields: Club Name, Title, Date, Start Time, End Time, and accept terms.' });
  }
  if (!termsAccepted) {
    console.error('Validation Error: Terms not accepted.');
    return res.status(400).json({ message: 'You must accept the terms and conditions.' });
  }

  // Convert incoming date and time strings to Moment objects for easier manipulation
  // IMPORTANT: Set your correct timezone here. Replace 'Asia/Kolkata' if your server/users are in a different timezone.
  const newBookingStartMoment = moment.tz(`${date}T${startTime}`, 'YYYY-MM-DDTHH:mm', 'Asia/Kolkata');
  const newBookingEndMoment = moment.tz(`${date}T${endTime}`, 'YYYY-MM-DDTHH:mm', 'Asia/Kolkata');

  // Server-side validation: End time must be after start time
  if (newBookingStartMoment.isSameOrAfter(newBookingEndMoment)) {
    console.error('Validation Error: End time is not after start time.');
    return res.status(400).json({ message: 'End time must be after start time.' });
  }

  // Define the buffer duration (60 minutes as per your requirement)
  const BUFFER_MINUTES = 60; // <<< THIS IS YOUR 60-MINUTE BUFFER

  let client; // Declare client here so it's accessible in the finally block
  try {
    client = await pool.connect(); // Get a client from the pool
    await client.query('BEGIN'); // Start a database transaction for atomicity

    // 2. Check for Overlapping Bookings with 60-Minute Buffer
    // Fixed the overlap check query - simplified and more reliable
    const overlapCheckQuery = `
      SELECT id, title, start_time, end_time
      FROM bookings
      WHERE
          date = $1 
          AND status IN ('approved', 'pending')
          AND (
              (start_time < $3::TIME + INTERVAL '${BUFFER_MINUTES} minutes')
              AND
              (end_time > $2::TIME - INTERVAL '${BUFFER_MINUTES} minutes')
          );
    `;

    const conflictingBookings = await client.query(overlapCheckQuery, [
      date,       // $1: The date of the new booking
      startTime,  // $2: The start time of the new booking
      endTime     // $3: The end time of the new booking
    ]);

    if (conflictingBookings.rows.length > 0) {
      await client.query('ROLLBACK'); // Found an overlap, so roll back the transaction
      console.error('Overlap detected:', conflictingBookings.rows);
      return res.status(409).json({ 
        message: `The selected time slot overlaps with an existing approved or pending booking (including 60-minute buffer). Please choose another time.`,
        conflictingBookings: conflictingBookings.rows
      });
    }

    // 3. If No Overlap, Insert the New Booking
    const insertQuery = `
      INSERT INTO bookings (user_id, club_name, title, description, date, start_time, end_time, terms_accepted, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
    `;
    const insertValues = [userId, club_name, title, description, date, startTime, endTime, termsAccepted, 'pending'];

    // Debugging: Log the query and values right before execution
    console.log('Executing INSERT query:');
    console.log('Query string:', insertQuery);
    console.log('Values array:', insertValues);
    console.log('Number of values in array:', insertValues.length);

    const booking = await client.query(insertQuery, insertValues);

    await client.query('COMMIT'); // Commit the transaction if everything was successful
    console.log('Booking created successfully:', booking.rows[0]);
    res.status(201).json({ 
      message: 'Booking created successfully!',
      booking: booking.rows[0] 
    }); // Return the newly created booking with 201 Created status

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK'); // Rollback the transaction on any server error
    }
    console.error('Error creating booking:', error); // Log the full error for debugging
    res.status(500).json({ message: 'Server error while creating booking.' });
  } finally {
    if (client) {
      client.release(); // Always release the client back to the pool
    }
  }
});

// GET /api/bookings - Get user's bookings
router.get('/', auth, requireRole(['club_leader', 'faculty']), async (req, res) => {
  try {
    // Added club_name to SELECT query
    const bookings = await pool.query('SELECT id, club_name, title, description, date, start_time, end_time, status, admin_comments, created_at FROM bookings WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(bookings.rows);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/public - Get approved bookings for public calendar
router.get('/public', async (req, res) => {
  try {
    // Added club_name to SELECT query
    const bookings = await pool.query('SELECT id, club_name, title, description, date, start_time, end_time, status FROM bookings WHERE status = $1 AND date >= CURRENT_DATE ORDER BY date ASC, start_time ASC', ['approved']);
    res.json(bookings.rows);
  } catch (error) {
    console.error('Error fetching public bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/bookings/:id - Update a booking (e.g., by the user)
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  // Added club_name to destructuring
  const { club_name, title, description, date, startTime, endTime, termsAccepted } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE bookings
       SET club_name = COALESCE($1, club_name), -- Added club_name to update
           title = COALESCE($2, title),
           description = COALESCE($3, description),
           date = COALESCE($4, date),
           start_time = COALESCE($5, start_time),
           end_time = COALESCE($6, end_time),
           terms_accepted = COALESCE($7, terms_accepted)
       WHERE id = $8 AND user_id = $9 AND status = 'pending'
       RETURNING *;`,
      [club_name, title, description, date, startTime, endTime, termsAccepted, id, userId] // Updated parameters
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found or not editable by this user.' });
    }

    res.json({ message: 'Booking updated successfully.', booking: result.rows[0] });

  } catch (error) {
    console.error(`Error updating booking ${id}:`, error);
    res.status(500).json({ message: 'Server error updating booking.' });
  }
});

module.exports = router;
*/

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