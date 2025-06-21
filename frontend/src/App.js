import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import BookingForm from './components/BookingForm';
import AdminPanel from './components/AdminPanel';
import PublicCalendar from './components/PublicCalendar';
import 'bootstrap/dist/css/bootstrap.min.css';

// Main application component with routing
const App = () => {
  return (
    <Router>
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/booking" element={<BookingForm />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/" element={<PublicCalendar />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;