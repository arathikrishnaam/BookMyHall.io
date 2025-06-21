// const express = require('express');
// const pool = require('../config/db');
// const { auth, requireRole } = require('../middleware/auth');
// const router = express.Router();

// // GET /api/admin/bookings - Get all pending bookings (admin only)
// router.get('/bookings', auth, requireRole(['admin']), async (req, res) => {
//   try {
//     const bookings = await pool.query('SELECT * FROM Bookings WHERE status = $1', ['pending']);
//     res.json(bookings.rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // PATCH /api/admin/bookings/:id - Approve or reject a booking (admin only)
// router.patch('/bookings/:id', auth, requireRole(['admin']), async (req, res) => {
//   const { status, comments } = req.body;
//   const { id } = req.params;

//   // Validate status
//   if (!['approved', 'rejected'].includes(status)) {
//     return res.status(400).json({ message: 'Invalid status' });
//   }

//   try {
//     const booking = await pool.query(
//       'UPDATE Bookings SET status = $1, description = $2 WHERE id = $3 RETURNING *',
//       [status, comments, id]
//     );
//     if (booking.rows.length === 0) {
//       return res.status(404).json({ message: 'Booking not found' });
//     }
//     res.json(booking.rows[0]);
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