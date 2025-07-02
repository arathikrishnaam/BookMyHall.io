import { jwtDecode } from 'jwt-decode'; // For decoding JWT tokens
import { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Import Bootstrap CSS (make sure this is in your main entry file, e.g., index.js)
import 'bootstrap/dist/css/bootstrap.min.css';

// Import your components and pages
import AdminPanel from './components/AdminPanel'; // Your Admin Panel component
import BookingForm from './components/BookingForm'; // Your Booking form component
import Login from './components/Login'; // Your Login component
import Navbar from './components/Navbar'; // Assuming you have a Navbar component
import ProtectedRoute from './components/ProtectedRoute'; // Your ProtectedRoute component
import PublicCalendar from './components/PublicCalendar'; // Your Public Calendar component
import Signup from './components/Signup'; // Your Signup component
import ThankYouPage from './components/Thankyou'; // Your ThankYou page component (assuming this name)
import TermsAndConditionsPage from './pages/TermsAndConditionsPage'; // The new Terms and Conditions page

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Function to handle successful login/signup
  const handleAuthSuccess = (token, role) => {
    localStorage.setItem('token', token); // Store token in localStorage
    setIsAuthenticated(true);
    setUserRole(role);
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token from localStorage
    setIsAuthenticated(false);
    setUserRole(null);
    // Optionally navigate to login page or home page after logout
    // You might need to use a hook or context for navigation outside Router context directly
  };

  // Check for existing token on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // Check if token is expired (optional, but good practice)
        const currentTime = Date.now() / 1000; // in seconds
        if (decodedToken.exp < currentTime) {
          handleLogout(); // Token expired, log out
        } else {
          setIsAuthenticated(true);
          setUserRole(decodedToken.role ? decodedToken.role.toLowerCase().trim() : null);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        handleLogout(); // Invalid token, log out
      }
    }
  }, []); // Run only once on mount

  return (
    <Router>
      {/* Navbar is typically outside the Routes so it appears on all pages */}
      <Navbar isAuthenticated={isAuthenticated} userRole={userRole} onLogout={handleLogout} />

      <div className="container mt-4"> {/* Add a container for consistent spacing */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicCalendar />} /> {/* Home page, showing public calendar */}
          <Route path="/login" element={<Login onLoginSuccess={handleAuthSuccess} />} />
          <Route path="/signup" element={<Signup onSignupSuccess={handleAuthSuccess} />} />
          <Route path="/terms" element={<TermsAndConditionsPage />} /> {/* New Terms Page */}
          <Route path="/thankyou" element={<ThankYouPage />} /> {/* Thank You Page */}


          {/* Protected Routes */}
          {/* Booking Form - accessible by club_leader or faculty */}
          <Route
            path="/booking"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} allowedRoles={['club_leader', 'faculty']}>
                <BookingForm />
              </ProtectedRoute>
            }
          />

          {/* Admin Panel - accessible by admin only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} allowedRoles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Fallback for unknown routes */}
          <Route path="*" element={<h3>404: Page Not Found</h3>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;