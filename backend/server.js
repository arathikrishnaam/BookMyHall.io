const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const dotenv = require('dotenv');


// Load environment variables from .env
dotenv.config();

// Import route handlers
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse incoming JSON

// Swagger API Documentation
const swaggerDocument = yaml.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
app.use('/api/auth', authRoutes);       // Auth (signup, login)
app.use('/api/bookings', bookingRoutes); // Bookings (create, list)
app.use('/api/admin', adminRoutes);     // Admin actions (approve, reject)

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📘 API docs available at http://localhost:${PORT}/api-docs`);
});
