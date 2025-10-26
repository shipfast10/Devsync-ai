const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

const app = express();

// ================== Middlewares ==================
app.use(cors());
app.use(express.json());

// ================== MongoDB Connection ==================
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ MongoDB Connection Error:', err));

// ================== Session Setup ==================
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'devsyncsecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set true if using HTTPS
  })
);

// ================== Passport Config ==================
require('./config/passportConfig'); // GitHub Strategy here
app.use(passport.initialize());
app.use(passport.session());

// ================== Routes ==================
const githubRoutes = require('./routes/githubRoutes');
app.use('/', githubRoutes);

// ================== Test Route ==================
app.get('/', (req, res) => {
  res.send('🚀 DevSync AI Backend Running!');
});

// ================== Start Server ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
