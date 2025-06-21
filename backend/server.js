// server.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const app = require('./app');

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
