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