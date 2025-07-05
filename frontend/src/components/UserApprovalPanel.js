// src/components/UserApprovalPanel.js
import { useEffect, useState } from 'react';
// Corrected imports: these functions are now correctly exported from '../api'
import { approveUser, getPendingUsers, rejectUser } from '../api';

const UserApprovalPanel = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Function to fetch pending users
  const fetchPendingUsers = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await getPendingUsers();
      setPendingUsers(response.data);
    } catch (err) {
      console.error('Error fetching pending users:', err.response?.data || err.message);
      setError('Failed to load pending users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Handle Approve action
  const handleApprove = async (userId) => {
    setMessage('');
    setError('');
    try {
      await approveUser(userId);
      setMessage('User approved successfully!');
      // Remove the approved user from the list
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
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
      // Remove the rejected user from the list
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Error rejecting user:', err.response?.data || err.message);
      setError('Failed to reject user.');
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading pending users...</div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-5">{error}</div>;
  }

  return (
    <div className="mt-5">
      <h3>User Approval Requests</h3>
      {message && <div className="alert alert-success">{message}</div>}
      {pendingUsers.length === 0 ? (
        <div className="alert alert-info">No pending user registrations at this time.</div>
      ) : (
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Requested Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td> {/* This will be 'faculty' for non-pre-approved users */}
                <td>
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

