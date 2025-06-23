// src/App.js
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Import all your components
import AdminPanel from './components/AdminPanel';
import BookingForm from './components/BookingForm';
import Login from './components/Login';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import PublicCalendar from './components/PublicCalendar';
import Signup from './components/Signup';
import ThankYou from './components/Thankyou';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    // Debugging Logs
    console.log('App.js useEffect - Initial Check - Token:', token ? 'Exists' : 'Missing', 'Role:', role);
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const handleLoginSuccess = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setIsAuthenticated(true);
    setUserRole(role);
    // Debugging Log
    console.log('App.js - handleLoginSuccess called. Authenticated:', true, 'Role set to:', role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  // Debugging Log
  console.log('App.js rendering - Navbar props: isAuthenticated =', isAuthenticated, ', userRole =', userRole);

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} userRole={userRole} onLogout={handleLogout} />
      <div className="container">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicCalendar />} />
          <Route path="/public-calendar" element={<PublicCalendar />} />
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/signup" element={<Signup onSignupSuccess={handleLoginSuccess} />} />
          <Route path="/Thankyou" element={<ThankYou />} />

          {/* Protected Routes */}
          {/* Booking Page - requires any user to be logged in AND NOT an admin */}
          <Route
            path="/booking"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                {userRole !== 'admin' ? ( // <-- NEW CONDITION HERE: Only for non-admin users
                  <BookingForm />
                ) : (
                  // If admin, show unauthorized message or redirect
                  <div className="alert alert-warning mt-5">
                    <h3>Access Denied</h3>
                    <p>Administrators do not need to make bookings. Please navigate to the Admin Panel.</p>
                  </div>
                )}
              </ProtectedRoute>
            }
          />

          {/* Admin Panel - requires user to be logged in AND have 'admin' role */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                {userRole === 'admin' ? (
                  <AdminPanel />
                ) : (
                  // If not admin, show unauthorized message or redirect
                  <div className="alert alert-warning mt-5">
                    <h3>Access Denied</h3>
                    <p>You must be an administrator to view this page.</p>
                  </div>
                )}
              </ProtectedRoute>
            }
          />

          {/* Fallback route for unmatched paths */}
          <Route path="*" element={<h3>404 - Page Not Found</h3>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;