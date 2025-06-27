import { useEffect, useState } from 'react';
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
      // Remove the booking from the list after successful action
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
              {/* Optional: Format the date more readably if needed, e.g., toLocaleDateString() */}
              <td>{booking.date.substring(0, 10)}</td> {/* Shows YYYY-MM-DD */}
              {/* FIX: Use snake_case to match database column names */}
              <td>
                {/* Ensure existence before substring to prevent errors if data is missing */}
                {booking.start_time ? booking.start_time.substring(0, 5) : 'N/A'} - {/* Format HH:MM */}
                {booking.end_time ? booking.end_time.substring(0, 5) : 'N/A'}    {/* Format HH:MM */}
              </td>
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
                      prompt('Enter rejection comments (optional):') || ''
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
      {bookings.length === 0 && !error && (
        <p className="text-center mt-3">No pending bookings to display.</p>
      )}
    </div>
  );
};

export default AdminPanel;