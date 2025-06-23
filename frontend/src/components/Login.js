// src/components/Login.js
import { jwtDecode } from 'jwt-decode';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login({ email, password });
      console.log('Login API Raw Response Data:', response.data);

      const token = response.data.token;
      let role = null;

      if (!token) {
        setError('Login response missing token.');
        return;
      }

      try {
        const decodedToken = jwtDecode(token);
        console.log('Decoded Token:', decodedToken);
        if (decodedToken && decodedToken.role) {
          role = decodedToken.role;
        }
      } catch (decodeError) {
        console.error('Error decoding token:', decodeError);
        setError('Failed to decode authentication token.');
        return;
      }

      if (role) {
        role = role.toLowerCase().trim();
      }

      console.log('Extracted Token:', token);
      console.log('Extracted Role (after normalization):', role);

      onLoginSuccess(token, role);

      if (role === 'admin') {
        navigate('/admin'); // Redirect admin directly to the admin panel
      } else {
        navigate('/booking'); // Redirect regular users to the booking page
      }

    } catch (err) {
      console.error('Login error:', err.response?.data || err.message || err);
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="mt-5">
      <h3>Login</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
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
            onChange={(e) => setPassword(e.target.value)} /* <-- CORRECTED THIS LINE */
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;