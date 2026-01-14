const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const participantRoutes = require('./routes/participantRoutes');
const adminRoutes = require('./routes/adminRoutes');
const passingPointRoutes = require('./routes/passingPointRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api', participantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', passingPointRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;


