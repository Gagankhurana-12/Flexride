// server.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const app = require('./app');

connectDB();

const PORT = process.env.PORT || 5000;

// Final check to confirm Cloudinary setup is complete.
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
