const express = require('express');
const { createRazorpayOrder } = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Create Razorpay order
router.post('/create-order', protect, createRazorpayOrder);

module.exports = router; 