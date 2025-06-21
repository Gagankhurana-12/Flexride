const express = require('express');
const { createBooking, getUserBookings, getVehicleBookings, cancelBooking } = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, createBooking); // create booking
router.get('/my', protect, getUserBookings); // get user's bookings
router.get('/vehicle/:vehicleId', protect, getVehicleBookings); // bookings for a vehicle
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
