const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', bookingId } = req.body;
    if (!amount || !bookingId) {
      return res.status(400).json({ message: 'Amount and bookingId are required.' });
    }
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency,
      receipt: `booking_${bookingId}`,
      payment_capture: 1,
    };
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, bookingId });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ message: 'Failed to create Razorpay order', error: error.message });
  }
}; 