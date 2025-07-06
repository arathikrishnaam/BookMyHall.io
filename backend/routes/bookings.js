/*
const express = require('express');
const pool = require('../config/db'); // Assuming this correctly imports your PostgreSQL pool
const { auth, requireRole } = require('../middleware/auth'); // Your authentication middleware
const router = express.Router();

// Make sure you have installed moment-timezone: npm install moment-timezone
const moment = require('moment-timezone'); // For robust date/time handling

// POST /api/bookings - Create a new booking (club_leader or faculty)
router.post('/', auth, requireRole(['club_leader', 'faculty']), async (req, res) => {
  const { title, description, date, startTime, endTime, termsAccepted } = req.body;
  const userId = req.user.id; // User ID from your authentication middleware

  // 1. Basic Validation (Client-side validation should also be in place)
  if (!termsAccepted) {
    return res.status(400).json({ message: 'You must accept the terms and conditions.' });
  }
  if (!title || !date || !startTime || !endTime) {
    return res.status(400).json({ message: 'Title, date, start time, and end time are required.' });
  }

  // Convert incoming date and time strings to Moment objects for easier manipulation
  // IMPORTANT: Set your correct timezone here. Replace 'Asia/Kolkata' if your server/users are in a different timezone.
  const newBookingStartMoment = moment.tz(`${date}T${startTime}`, 'YYYY-MM-DDTHH:mm', 'Asia/Kolkata');
  const newBookingEndMoment = moment.tz(`${date}T${endTime}`, 'YYYY-MM-DDTHH:mm', 'Asia/Kolkata');

  // Server-side validation: End time must be after start time
  if (newBookingStartMoment.isSameOrAfter(newBookingEndMoment)) {
    return res.status(400).json({ message: 'End time must be after start time.' });
  }

  // Define the buffer duration (60 minutes as per your requirement)
  const BUFFER_MINUTES = 60; // <<< THIS IS YOUR 60-MINUTE BUFFER

  let client; // Declare client here so it's accessible in the finally block
  try {
    client = await pool.connect(); // Get a client from the pool
    await client.query('BEGIN'); // Start a database transaction for atomicity

    // 2. Check for Overlapping Bookings with 60-Minute Buffer
    // This query checks if the NEW (buffered) time range overlaps with ANY existing booking
    // that is either 'approved' or 'pending' on the same date.
    const overlapCheckQuery = `
      SELECT id
      FROM bookings
      WHERE
          date = $1 -- On the same specific date
          AND status IN ('approved', 'pending') -- Crucial: Check against APPROVED OR PENDING bookings
          AND (
              -- Standard interval overlap logic: (A.start < B.end) AND (A.end > B.start)
              -- Here:
              -- A is the EXISTING booking time range: (bookings.start_time + bookings.date) to (bookings.end_time + bookings.date)
              -- B is the NEW (BUFFERED) booking time range: ($2::TIME + $1::DATE - 60min) to ($3::TIME + $1::DATE + 60min)

              -- Condition 1: Existing booking's start_time is before the NEW BUFFERED end_time
              ( (bookings.start_time + bookings.date) < ($3::TIME + $1::DATE + INTERVAL '${BUFFER_MINUTES} MINUTES') )
              AND
              -- Condition 2: Existing booking's end_time is after the NEW BUFFERED start_time
              ( (bookings.end_time + bookings.date) > ($2::TIME + $1::DATE - INTERVAL '${BUFFER_MINUTES} MINUTES') )
          );
    `;

    const conflictingBookings = await client.query(overlapCheckQuery, [
      date,      // $1: The date of the new booking
      startTime, // $2: The start time of the new booking
      endTime    // $3: The end time of the new booking
    ]);

    if (conflictingBookings.rows.length > 0) {
      await client.query('ROLLBACK'); // Found an overlap, so roll back the transaction
      return res.status(409).json({ message: `The selected time slot overlaps with an existing approved or pending booking. Please choose another time.` });
    }

    // 3. If No Overlap, Insert the New Booking
    // This part is only reached if no conflicts were found.
    const booking = await client.query(
      'INSERT INTO bookings (user_id, title, description, date, start_time, end_time, terms_accepted, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, title, description, date, startTime, endTime, termsAccepted, 'pending'] // New bookings start as 'pending'
    );

    await client.query('COMMIT'); // Commit the transaction if everything was successful
    res.status(201).json(booking.rows[0]); // Return the newly created booking with 201 Created status

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

// GET /api/bookings - Get user's bookings (no changes needed)
router.get('/', auth, requireRole(['club_leader', 'faculty']), async (req, res) => {
  try {
    const bookings = await pool.query('SELECT * FROM bookings WHERE user_id = $1', [req.user.id]);
    res.json(bookings.rows);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/public - Get approved bookings for public calendar (no changes needed)
router.get('/public', async (req, res) => {
  try {
    const bookings = await pool.query('SELECT * FROM bookings WHERE status = $1', ['approved']);
    res.json(bookings.rows);
  } catch (error) {
    console.error('Error fetching public bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
*/
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