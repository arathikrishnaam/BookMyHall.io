// src/components/ProtectedRoute.js
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    // If not authenticated, redirect them to the login page
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child components (the protected content)
  // `children` is used when the component is passed as a child (e.g., <ProtectedRoute><BookingForm /></ProtectedRoute>)
  // `Outlet` is used when it's a layout route (e.g., <Route element={<ProtectedRoute />}> <Route path="/booking" ... /> </Route>)
  // In our case, we'll use `children` for simplicity.
  return children ? children : <Outlet />;
};

export default ProtectedRoute;