/*
import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add JWT token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);

// Booking endpoints
export const createBooking = (data) => API.post('/bookings', data);
export const getBookings = () => API.get('/bookings');
export const getPublicBookings = () => API.get('/bookings/public');

// Admin endpoints
export const getPendingBookings = () => API.get('/admin/bookings');
export const updateBooking = (id, data) => API.patch(`/admin/bookings/${id}`, data);

*/

// src/api.js
import axios from 'axios';

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:5000/api'; // Assuming your Express routes are mounted under /api

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  // Your backend middleware/auth.js expects 'Authorization: Bearer <token>'
  return {
    headers: {
      'Authorization': `Bearer ${token}`, // Ensure this matches your backend's expected header
      'Content-Type': 'application/json'
    }
  };
};

// --- Authentication API Calls ---

// User Signup: POST /api/auth/signup
export const signup = (userData) => axios.post(`${API_BASE_URL}/auth/signup`, userData);

// User Login: POST /api/auth/login
export const login = (credentials) => axios.post(`${API_BASE_URL}/auth/login`, credentials);


// --- Booking API Calls (Assuming these are defined within routes/bookings.js) ---

// Create Booking: POST /api/bookings
export const createBooking = (bookingData) => axios.post(`${API_BASE_URL}/bookings`, bookingData, getAuthHeaders());

// Get User's Bookings: GET /api/bookings (assuming this gets bookings for the authenticated user)
export const getBookings = () => axios.get(`${API_BASE_URL}/bookings`, getAuthHeaders());

// Get Public Calendar Data: GET /api/bookings/public
// IMPORTANT: This assumes your routes/bookings.js has a route like `router.get('/public', ...)`
export const getPublicBookings = () => axios.get(`${API_BASE_URL}/bookings/public`);

// Update Booking (generic): PUT /api/bookings/:id
export const updateBooking = (bookingId, updateData) => axios.put(`${API_BASE_URL}/bookings/${bookingId}`, updateData, getAuthHeaders());


// --- Admin-specific Booking API Calls (Defined in routes/admin.js) ---

// Get Pending Bookings for Admin: GET /api/admin/bookings/pending
export const getPendingBookings = () => axios.get(`${API_BASE_URL}/admin/bookings/pending`, getAuthHeaders());

// NEW EXPORTS: Approve a Booking: PUT /api/admin/bookings/:id/approve
export const approveBooking = (bookingId, adminComments = '') => axios.put(`${API_BASE_URL}/admin/bookings/${bookingId}/approve`, { adminComments }, getAuthHeaders());

// NEW EXPORTS: Reject a Booking: PUT /api/admin/bookings/:id/reject
export const rejectBooking = (bookingId, adminComments = '') => axios.put(`${API_BASE_URL}/admin/bookings/${bookingId}/reject`, { adminComments }, getAuthHeaders());


// --- Admin User Approval API Calls (Defined in routes/auth.js, mounted under /api/auth) ---

// Get Pending Users for Admin Approval: GET /api/auth/admin/users/pending
export const getPendingUsers = () => axios.get(`${API_BASE_URL}/auth/admin/users/pending`, getAuthHeaders());

// Approve a User: PUT /api/auth/admin/users/:id/approve
export const approveUser = (userId) => axios.put(`${API_BASE_URL}/auth/admin/users/${userId}/approve`, {}, getAuthHeaders());

// Reject a User: PUT /api/auth/admin/users/:id/reject
export const rejectUser = (userId) => axios.put(`${API_BASE_URL}/auth/admin/users/${userId}/reject`, {}, getAuthHeaders());

