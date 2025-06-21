const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

exports.createBooking = async (req, res) => {
  const { 
    vehicle, 
    startDate, 
    endDate, 
    totalPrice, 
    bookingType, 
    startTime, 
    endTime 
  } = req.body;

  try {
    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) return res.status(404).json({ message: 'Vehicle not found' });

    const booking = await Booking.create({
      user: req.user._id,
      vehicle,
      startDate,
      endDate,
      totalPrice,
      bookingType,
      startTime,
      endTime,
    });

    // Populate the vehicle and user details for the response
    await booking.populate({
      path: 'vehicle',
      populate: {
        path: 'user',
        select: 'name avatar'
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ message: 'Booking failed', error: error.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'vehicle',
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Could not fetch bookings' });
  }
};

exports.getVehicleBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ vehicle: req.params.vehicleId });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch bookings for this vehicle' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    booking.status = 'cancelled';
    await booking.save();
    
    await booking.populate({
      path: 'vehicle',
      populate: {
        path: 'user',
        select: 'name avatar'
      }
    });

    res.json(booking);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Could not cancel booking' });
  }
};
