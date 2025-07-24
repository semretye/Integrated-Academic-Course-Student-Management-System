require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const path = require('path');

const connectDB = require('./src/config/db'); // MongoDB connection function
const { exec } = require('child_process');

const app = express();


// Enhanced CORS Configuration
const allowedOrigins = ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
    credentials: true,
 allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'X-Requested-With'],
   exposedHeaders: ['Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'no-store');
  }
}));



// Route logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/students', require('./src/routes/studentRoutes'));
app.use('/api/instructors', require('./src/routes/instructureRoutes'));
app.use('/api/courses', require('./src/routes/courseRoutes'));
app.use('/api/assigned-courses', require( './src/routes/assignedcourseRoutes'));
app.use('/api/admin', require( './src/routes/adminRoutes'));
app.use('/api', require('./src/routes/materialRoutes'));
app.use('/api', require('./src/routes/assignmentRoutes'));
app.use('/api', require('./src/routes/scheduleRoutes'));
app.use('/api/instructors', require('./src/routes/instructordashboardRoutes'));
app.use('/api/submissions', require('./src/routes/submissionRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api', require('./src/routes/transcriptRoutes'));
app.use('/api/payments', require('./src/routes/paymentRoutes'));
// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Utility: Find available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.unref();
    server.on('error', () => resolve(findAvailablePort(startPort + 1)));
    server.listen(startPort, () => {
      server.close(() => resolve(startPort));
    });
  });
};

// Start server
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();
    console.log('MongoDB connected successfully');

    // 2. Check for available port
    const PORT = process.env.PORT || 8080;
    const availablePort = await findAvailablePort(PORT);

    if (availablePort !== PORT) {
      console.warn(`Port ${PORT} is in use. Using available port ${availablePort}`);
    }

    // 3. Start Express server
    const server = app.listen(availablePort, () => {
      console.log(`Server running on port ${availablePort}`);
      console.log(`Health Check: http://localhost:${availablePort}/api/health`);
    });

    // 4. Graceful shutdown
    const shutdown = () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start the server
startServer();
