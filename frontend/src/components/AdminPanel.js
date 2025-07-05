// src/components/AdminPanel.js
import { useEffect, useState } from 'react';
// Import specific booking approval/rejection functions
import { approveBooking, getPendingBookings, rejectBooking } from '../api';

// Admin panel to manage pending bookings
const AdminPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // For success/info messages

  // Fetch pending bookings on mount
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true); // Set loading true before fetch
      setError(''); // Clear previous errors
      setMessage(''); // Clear previous messages
      try {
        const response = await getPendingBookings(); // This now calls /api/admin/bookings/pending
        setBookings(response.data);
      } catch (err) {
        console.error('Failed to load bookings:', err.response?.data || err.message);
        setError('Failed to load bookings. Please ensure the backend is running and the API path is correct.');
      } finally {
        setLoading(false); // Set loading false after fetch
      }
    };
    fetchBookings();
  }, []);

  // Handle approve/reject actions
  const handleAction = async (id, actionType) => { // actionType will be 'approved' or 'rejected'
    setError(''); // Clear previous errors
    setMessage(''); // Clear previous messages
    let comments = '';

    if (actionType === 'rejected') {
      comments = prompt('Enter rejection comments (optional):') || '';
    }

    try {
      if (actionType === 'approved') {
        await approveBooking(id, comments); // Use specific approveBooking API call
        setMessage(`Booking ${id} approved successfully!`);
      } else if (actionType === 'rejected') {
        await rejectBooking(id, comments); // Use specific rejectBooking API call
        setMessage(`Booking ${id} rejected successfully!`);
      }

      // Remove the booking from the list after successful action
      setBookings(bookings.filter((booking) => booking.id !== id));
    } catch (err) {
      console.error('Action failed:', err.response?.data || err.message);
      setError('Action failed: Could not update booking status.');
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading pending bookings...</div>;
  }

  return (
    <div className="mt-5">
      <h3>Admin Panel - Pending Booking Requests</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>} {/* Display success/info messages */}

      {bookings.length === 0 && !error ? ( // Only show this if no error and no bookings
        <p className="text-center mt-3 alert alert-info">No pending bookings to display.</p>
      ) : (
        <table className="table table-bordered table-striped table-hover">
          <thead>
            <tr>
              <th>Title</th>
              <th>Requested By</th> {/* New column */}
              <th>Requester Email</th> {/* New column */}
              <th>Date</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.title}</td>
                <td>{booking.user_name}</td> {/* Display user's name */}
                <td>{booking.user_email}</td> {/* Display user's email */}
                <td>{new Date(booking.date).toLocaleDateString()}</td> {/* Format date */}
                <td>
                  {booking.start_time ? booking.start_time.substring(0, 5) : 'N/A'} -
                  {booking.end_time ? booking.end_time.substring(0, 5) : 'N/A'}
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
                    onClick={() => handleAction(booking.id, 'rejected')}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPanel;

