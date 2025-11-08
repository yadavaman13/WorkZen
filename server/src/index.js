const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');
const { cleanupExpiredTokens, getTokenStats } = require('./jobs/cleanupResetTokens');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// initialize DB (create tables if needed)
db.init()
  .then(() => {
    console.log('✅ Database initialized');
    
    // Run cleanup job immediately on startup
    cleanupExpiredTokens()
      .then(() => console.log('✅ Initial token cleanup completed'))
      .catch(err => console.error('❌ Initial cleanup failed:', err));
    
    // Schedule cleanup job to run every hour
    setInterval(async () => {
      console.log('🔄 Running scheduled token cleanup...');
      await cleanupExpiredTokens();
      
      // Log stats for monitoring
      const stats = await getTokenStats();
      if (stats) {
        console.log(`📊 Token stats: ${stats.active} active, ${stats.used} used, ${stats.expired} expired`);
      }
    }, 60 * 60 * 1000); // 1 hour
  })
  .catch((err) => {
    console.error('❌ DB init error', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => res.json({ msg: 'WorkZen API up' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const stats = await getTokenStats();
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tokenStats: stats
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ WorkZen server listening on port ${PORT}`));

module.exports = app;
