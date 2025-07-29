const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const medicineRoutes = require('./routes/medicineRoutes');
const alertRoutes = require('./routes/alertRoutes');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const mlIntegrationRoutes = require('./routes/mlIntegration');
const { setupScheduledTasks } = require('./utils/scheduler');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS configuration
app.use(cors({
  // In production, restrict origins to your Netlify domain
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://medi-track-management.netlify.app', 'http://localhost:3000'] 
    : 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json());

// Routes
app.use('/api/medicines', medicineRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/recommendation', mlIntegrationRoutes);

// Simple test route for checking connection
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Health check endpoint (useful for Render)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Set port
const PORT = process.env.PORT || 5000;

// Connect to database and then set up schedules
const startServer = async () => {
  try {
    await connectDB();
    
    // Set up scheduled tasks including automated alert generation
    setupScheduledTasks();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`❌ Server Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
