const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PORT } = require('./config/apiKeys');

const researcherRoutes = require('./routes/researchers');
const scoringRoutes = require('./routes/scoring');
const evaluationRoutes = require('./routes/evaluation');
const profileSearchRoutes = require('./routes/profileSearch');
const cacheRoutes = require('./routes/cache');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/researchers', researcherRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/profile-search', profileSearchRoutes);
app.use('/api/cache', cacheRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Researcher Tool API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
});
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - *    /api/researchers`);
  console.log(`   - *    /api/scoring`);
  console.log(`   - *    /api/evaluation`);
  console.log(`   - *    /api/profile-search`);
  console.log(`   - *    /api/cache`);
}); 