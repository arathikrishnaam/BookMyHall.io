// const express = require('express');
// const pool = require('../config/db');
// const { auth, requireRole } = require('../middleware/auth');
// const router = express.Router();

// // POST /api/bookings - Create a new booking (club_leader or faculty)
// router.post('/', auth, requireRole(['club_leader', 'faculty']), async (req, res) => {
//   const { title, description, date, startTime, endTime, termsAccepted } = req.body;

//   // Validate terms acceptance
//   if (!termsAccepted) {
//     return res.status(400).json({ message: 'You must accept the terms and conditions' });
//   }

//   try {
//     // Check for time conflicts with approved bookings
//     const conflictingBookings = await pool.query(
//       `SELECT * FROM Bookings 
//        WHERE date = $1 
//        AND status = 'approved'
//        AND (
//          (startTime <= $2 AND endTime > $2) OR 
//          (startTime < $3 AND endTime >= $3) OR
//          (startTime >= $2 AND endTime <= $3)
//        )`,
//       [date, startTime, endTime]
//     );

//     if (conflictingBookings.rows.length > 0) {
//       return res.status(400).json({ message: 'Booking conflict detected' });
//     }

//     // Insert new booking
//     const booking = await pool.query(
//       'INSERT INTO Bookings (userId, title, description, date, startTime, endTime) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
//       [req.user.id, title, description, date, startTime, endTime]
//     );

//     res.json(booking.rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // GET /api/bookings - Get user's bookings
// router.get('/', auth, requireRole(['club_leader', 'faculty']), async (req, res) => {
//   try {
//     const bookings = await pool.query('SELECT * FROM Bookings WHERE userId = $1', [req.user.id]);
//     res.json(bookings.rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // GET /api/bookings/public - Get approved bookings for public calendar
// router.get('/public', async (req, res) => {
//   try {
//     const bookings = await pool.query('SELECT * FROM Bookings WHERE status = $1', ['approved']);
//     res.json(bookings.rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;

/*
const express = require('express');
const pool = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const router = express.Router();

// POST /api/bookings - Create a new booking (club_leader or faculty)
router.post('/', auth, requireRole(['club_leader', 'faculty']), async (req, res) => {
  const { title, description, date, startTime, endTime, termsAccepted } = req.body;

  // Validate terms acceptance
  if (!termsAccepted) {
    return res.status(400).json({ message: 'You must accept the terms and conditions' });
  }

  try {
    // Check for time conflicts with approved bookings
    const conflictingBookings = await pool.query(
      `SELECT * FROM bookings 
       WHERE date = $1 
       AND status = 'approved'
       AND (
         (start_time <= $2 AND end_time > $2) OR 
         (start_time < $3 AND end_time >= $3) OR
         (start_time >= $2 AND end_time <= $3)
       )`,
      [date, startTime, endTime]
    );

    if (conflictingBookings.rows.length > 0) {
      return res.status(400).json({ message: 'Booking conflict detected' });
    }

    // Insert new booking
    const booking = await pool.query(
      'INSERT INTO bookings (user_id, title, description, date, start_time, end_time, terms_accepted) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, title, description, date, startTime, endTime, termsAccepted]
    );

    res.json(booking.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings - Get user's bookings
router.get('/', auth, requireRole(['club_leader', 'faculty']), async (req, res) => {
  try {
    const bookings = await pool.query('SELECT * FROM bookings WHERE user_id = $1', [req.user.id]);
    res.json(bookings.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/public - Get approved bookings for public calendar
router.get('/public', async (req, res) => {
  try {
    const bookings = await pool.query('SELECT * FROM bookings WHERE status = $1', ['approved']);
    res.json(bookings.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
*/

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