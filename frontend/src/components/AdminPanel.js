// src/components/AdminPanel.js
import { useEffect, useState } from 'react';
import { approveBooking, getAllBookings, rejectBooking } from '../api';

const AdminPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Function to fetch all bookings
  const fetchAllBookings = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await getAllBookings();
      setBookings(response.data);
    } catch (err) {
      console.error('Failed to load all bookings:', err.response?.data || err.message);
      setError('Failed to load all bookings. Please ensure the backend is running and the API path is correct.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  // Helper function to check if a booking can be cancelled (more than 24 hours before start)
  const canCancel = (bookingDateInput, startTimeStr) => {
    if (!bookingDateInput || !startTimeStr) {
      console.warn("canCancel received invalid date or time string:", { bookingDateInput, startTimeStr });
      return false;
    }

    try {
      let bookingDate;
      
      // Handle different date formats
      if (bookingDateInput.includes('T')) {
        // ISO format: YYYY-MM-DDTHH:MM:SS
        bookingDate = new Date(bookingDateInput);
      } else if (bookingDateInput.includes('/')) {
        // MM/DD/YYYY format
        const dateParts = bookingDateInput.split('/');
        if (dateParts.length === 3) {
          const month = parseInt(dateParts[0], 10) - 1; // Month is 0-indexed
          const day = parseInt(dateParts[1], 10);
          const year = parseInt(dateParts[2], 10);
          bookingDate = new Date(year, month, day);
        } else {
          console.error("Invalid date format:", bookingDateInput);
          return false;
        }
      } else if (bookingDateInput.includes('-')) {
        // YYYY-MM-DD format
        const dateParts = bookingDateInput.split('-');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
          const day = parseInt(dateParts[2], 10);
          bookingDate = new Date(year, month, day);
        } else {
          console.error("Invalid date format:", bookingDateInput);
          return false;
        }
      } else {
        console.error("Unrecognized date format:", bookingDateInput);
        return false;
      }

      // Parse time (HH:MM format)
      const timeOnlyPart = startTimeStr.substring(0, 5); // Get "HH:MM" part
      const [hoursStr, minutesStr] = timeOnlyPart.split(':');
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      // Set the time on the booking date
      bookingDate.setHours(hours, minutes, 0, 0);

      // Check for invalid date
      if (isNaN(bookingDate.getTime())) {
        console.error("Invalid date created from:", { bookingDateInput, startTimeStr });
        return false;
      }

      // Current time
      const now = new Date();
      
      // Calculate 24 hours before the event start time
      const twentyFourHoursBefore = new Date(bookingDate.getTime() - (24 * 60 * 60 * 1000));

      // Debugging logs
      console.log("--- canCancel Debug ---");
      console.log("Original inputs:", { bookingDateInput, startTimeStr });
      console.log("Parsed booking date/time:", bookingDate);
      console.log("Current time:", now);
      console.log("24 hours before event:", twentyFourHoursBefore);
      console.log("Can cancel:", now < twentyFourHoursBefore);
      console.log("-----------------------");

      return now < twentyFourHoursBefore;
    } catch (error) {
      console.error("Error in canCancel function:", error);
      return false;
    }
  };

  // Handle approve/reject actions
  const handleAction = async (id, actionType) => {
    setError('');
    setMessage('');
    let comments = '';

    if (actionType === 'rejected') {
      comments = prompt('Enter comments (optional):') || '';
    }

    try {
      if (actionType === 'approved') {
        await approveBooking(id, comments);
        setMessage(`Booking ${id} approved and marked as Booked!`);
      } else if (actionType === 'rejected') {
        await rejectBooking(id, comments);
        setMessage(`Booking ${id} has been cancelled.`);
      }

      fetchAllBookings();
    } catch (err) {
      console.error('Action failed:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Action failed: Could not update booking status.');
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading bookings...</div>;
  }

  return (
    <div className="mt-5">
      <h3>Admin Panel - All Bookings</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {bookings.length === 0 && !error ? (
        <p className="text-center mt-3 alert alert-info">No bookings to display.</p>
      ) : (
        <table className="table table-bordered table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Requested By</th>
              <th>Requester Email</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th style={{ width: '250px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.id}</td>
                <td>{booking.title}</td>
                <td>{booking.user_name}</td>
                <td>{booking.user_email}</td>
                <td>{new Date(booking.date).toLocaleDateString()}</td>
                <td>
                  {booking.start_time ? booking.start_time.substring(0, 5) : 'N/A'} -
                  {booking.end_time ? booking.end_time.substring(0, 5) : 'N/A'}
                </td>
                <td>
                  <span className={`badge bg-${
                    booking.status === 'approved' ? 'success' :
                    booking.status === 'rejected' ? 'danger' :
                    'warning'
                  }`}>
                    {booking.status === 'approved' ? 'Booked' :
                     booking.status === 'rejected' ? 'Cancelled' :
                     'Pending'}
                  </span>
                </td>
                <td>
                  {booking.status === 'pending' && (
                    <div className="d-flex justify-content-center">
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => handleAction(booking.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleAction(booking.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {booking.status === 'approved' && (
                    <div className="d-flex justify-content-center">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleAction(booking.id, 'rejected')}
                        disabled={!canCancel(booking.date, booking.start_time)}
                        title={!canCancel(booking.date, booking.start_time) ? "Cannot cancel within 24 hours of event start" : "Cancel this booking"}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {booking.status === 'rejected' && (
                    <div className="d-flex justify-content-center">
                      <button className="btn btn-secondary btn-sm" disabled>
                        Cancelled
                      </button>
                    </div>
                  )}
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