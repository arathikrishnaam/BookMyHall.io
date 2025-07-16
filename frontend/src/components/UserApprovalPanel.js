// src/components/UserApprovalPanel.js
import { useEffect, useState } from 'react';
// Corrected imports: these functions are now correctly exported from '../api'
// Assuming you'll add getAllUsers to your api.js file
import { approveUser, getAllUsers, rejectUser } from '../api'; // Modified import

const UserApprovalPanel = () => {
  const [users, setUsers] = useState([]); // Changed from pendingUsers to users
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Function to fetch all users (pending, approved, rejected)
  const fetchAllUsers = async () => { // Renamed function
    setLoading(true);
    setError('');
    setMessage('');
    try {
      // Assuming getAllUsers API call returns all users with their status
      const response = await getAllUsers();
      setUsers(response.data); // Set all users
    } catch (err) {
      console.error('Error fetching users:', err.response?.data || err.message);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers(); // Call the new fetchAllUsers
  }, []);

  // Handle Approve action
  const handleApprove = async (userId) => {
    setMessage('');
    setError('');
    try {
      await approveUser(userId);
      setMessage('User approved successfully!');
      // Update the status of the approved user in the state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'approved' } : user
        )
      );
    } catch (err) {
      console.error('Error approving user:', err.response?.data || err.message);
      setError('Failed to approve user.');
    }
  };

  // Handle Reject action
  const handleReject = async (userId) => {
    setMessage('');
    setError('');
    try {
      await rejectUser(userId);
      setMessage('User rejected successfully!');
      // Update the status of the rejected user in the state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'rejected' } : user
        )
      );
    } catch (err) {
      console.error('Error rejecting user:', err.response?.data || err.message);
      setError('Failed to reject user.');
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading users...</div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-5">{error}</div>;
  }

  return (
    <div className="mt-5">
      <h3>User Approval Requests</h3>
      {message && <div className="alert alert-success">{message}</div>}
      {users.length === 0 ? (
        <div className="alert alert-info">No user registrations to display.</div>
      ) : (
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Requested Role</th>
              <th>Actions / Status</th> {/* Changed column header */}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  {user.status === 'pending' ? ( // Conditionally render buttons or status
                    <>
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => handleApprove(user.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(user.id)}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className={`badge ${user.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)} {/* Capitalize status */}
                    </span>
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

export default UserApprovalPanel;