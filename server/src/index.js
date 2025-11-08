const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// initialize DB (create tables if needed)
db.init()
  .then(() => console.log('Database initialized'))
  .catch((err) => {
    console.error('DB init error', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => res.json({ msg: 'WorkZen API up' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`WorkZen server listening on port ${PORT}`));

module.exports = app;
