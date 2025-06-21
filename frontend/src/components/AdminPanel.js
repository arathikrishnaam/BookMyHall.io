import React, { useState, useEffect } from 'react';
import { getPendingBookings, updateBooking } from '../api';

// Admin panel to manage pending bookings
const AdminPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  // Fetch pending bookings on mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await getPendingBookings();
        setBookings(response.data);
      } catch (err) {
        setError('Failed to load bookings');
      }
    };
    fetchBookings();
  }, []);

  // Handle approve/reject actions
  const handleAction = async (id, status, comments = '') => {
    try {
      await updateBooking(id, { status, comments });
      setBookings(bookings.filter((booking) => booking.id !== id));
    } catch (err) {
      setError('Action failed');
    }
  };

  return (
    <div className="mt-5">
      <h3>Admin Panel - Pending Bookings</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>{booking.title}</td>
              <td>{booking.date}</td>
              <td>{`${booking.startTime} - ${booking.endTime}`}</td>
              <td>
                <button
                  className="btn btn-success me-2"
                  onClick={() => handleAction(booking.id, 'approved')}
                >
                  Approve
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() =>
                    handleAction(
                      booking.id,
                      'rejected',
                      prompt('Enter rejection comments:') || ''
                    )
                  }
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;