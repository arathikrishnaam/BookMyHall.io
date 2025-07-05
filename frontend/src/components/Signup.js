/*
// src/components/Signup.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api';

// Signup form component
// It now accepts onSignupSuccess as a prop (same as onLoginSuccess from App.js)
const Signup = ({ onSignupSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await signup({ name, email, password });
      // Assuming signup endpoint also returns a token and role,
      // call onSignupSuccess to update App.js state
      onSignupSuccess(response.data.token, response.data.role); // Pass token and role
      navigate('/booking'); // Redirect to booking page after successful signup
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="mt-5">
      <h3>Sign Up</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Sign Up</button>
      </form>
    </div>
  );
};

export default Signup;
*/
// src/components/Signup.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api'; // Import the signup API call

// Signup form component
const Signup = ({ onSignupSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // For success messages
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setMessage(''); // Clear previous messages

    try {
      const response = await signup({ name, email, password });
      const { data } = response;

      // Check the status returned by the backend
      if (data.status === 'pending') {
        // If account is pending approval (for non-pre-approved users)
        setMessage(data.message);
        // Redirect to the ThankYou page
        navigate('/thankyou'); // <-- Changed this line
      } else if (data.status === 'approved' && data.token) {
        // If account is immediately approved (e.g., pre-approved user)
        onSignupSuccess(data.token, data.role); // Update App.js state with token and role
        setMessage(data.message);
        // Redirect based on role
        if (data.role && data.role.toLowerCase().trim() === 'admin') {
          navigate('/admin');
        } else {
          navigate('/booking'); // Redirect regular users to the booking page
        }
      } else {
        // Fallback for any unexpected success response structure
        setMessage(data.message || 'Signup successful. Please log in.');
        navigate('/login');
      }

    } catch (err) {
      console.error('Signup error:', err.response?.data || err.message || err);
      // Display specific error messages from the backend
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="mt-5">
      <h3>Sign Up</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-info">{message}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Sign Up</button>
      </form>
    </div>
  );
};

export default Signup;

