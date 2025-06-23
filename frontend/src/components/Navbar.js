// src/components/Navbar.js
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ isAuthenticated, userRole, onLogout }) => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  // Debugging Log (keep this for now for verification)
  console.log('Navbar rendering - isAuthenticated:', isAuthenticated, 'userRole:', userRole);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">Hall Booking</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {/* Always visible: Calendar */}
            <li className="nav-item">
              <Link className="nav-link" to="/">Calendar</Link>
            </li>

            {isAuthenticated ? (
              // Links for logged-in users
              <>
                {/* Booking link: Visible if authenticated AND NOT an admin */}
                {userRole !== 'admin' && ( // <-- NEW CONDITION HERE
                  <li className="nav-item">
                    <Link className="nav-link" to="/booking">Book</Link>
                  </li>
                )}
                {/* Admin Panel link: Visible ONLY if authenticated AND has 'admin' role */}
                {userRole === 'admin' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/admin">Admin Panel</Link>
                  </li>
                )}
                <li className="nav-item">
                  <button className="nav-link btn btn-link text-white" onClick={handleLogoutClick} style={{ textDecoration: 'none', border: 'none', background: 'none' }}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              // Links for logged-out users
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/signup">Sign Up</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;