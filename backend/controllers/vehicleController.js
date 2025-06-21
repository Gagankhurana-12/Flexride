const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

// @desc    Add a new vehicle
// @route   POST /api/vehicles
// @access  Private
const addVehicle = async (req, res) => {
  // Parse all fields from req.body
  const { name, category, description, pricePerDay, seats, transmission, fuelType, location } = req.body;
  let imageUrl = req.body.imageUrl || '';

  // Parse numbers
  const parsedSeats = parseInt(seats, 10);
  const parsedPrice = parseInt(pricePerDay, 10);

  // Check for required fields
  if (!name || !category || !parsedPrice || !parsedSeats || !transmission) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (req.file) {
    // Use the path to the uploaded file, normalized for URL
    imageUrl = `/uploads/vehicles/${req.file.filename}`;
  }

  try {
    const vehicle = new Vehicle({
      user: req.user._id,
      name,
      category,
      imageUrl,
      description,
      pricePerDay: parsedPrice,
      seats: parsedSeats,
      transmission,
      fuelType,
      location,
    });

    const savedVehicle = await vehicle.save();
    res.status(201).json(savedVehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error adding vehicle', error: error.message });
  }
};

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicles', error: error.message });
  }
};

// @desc    Get a single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('user', 'name avatar createdAt');
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle', error: error.message });
  }
};

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private
const updateVehicle = async (req, res) => {
  const { name, category, description, pricePerDay, seats, transmission, fuelType, location } = req.body;

  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    // Update fields from request
    vehicle.name = name || vehicle.name;
    vehicle.category = category || vehicle.category;
    vehicle.description = description || vehicle.description;
    vehicle.pricePerDay = parseInt(pricePerDay, 10) || vehicle.pricePerDay;
    vehicle.seats = parseInt(seats, 10) || vehicle.seats;
    vehicle.transmission = transmission || vehicle.transmission;
    vehicle.fuelType = fuelType || vehicle.fuelType;
    vehicle.location = location || vehicle.location;

    // If a new image is uploaded, update the imageUrl
    if (req.file) {
      vehicle.imageUrl = `/uploads/vehicles/${req.file.filename}`;
    }

    const updatedVehicle = await vehicle.save();
    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vehicle', error: error.message });
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    if (vehicle.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    await Vehicle.deleteOne({ _id: vehicle._id }); // ✅ Fixed this line
    res.json({ message: 'Vehicle deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vehicle', error: error.message });
  }
};

// @desc    Get vehicles added by the logged-in user
// @route   GET /api/vehicles/my
const getMyVehicles = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const vehicles = await Vehicle.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your vehicles', error: error.message });
  }
};

// @desc    Rate a vehicle for a booking
// @route   POST /api/vehicles/:vehicleId/bookings/:bookingId/rate
// @access  Private
const rateVehicle = async (req, res) => {
  const { rating } = req.body;
  const { vehicleId, bookingId } = req.params;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Please provide a rating between 1 and 5.' });
  }

  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to rate this booking.' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'You can only rate completed bookings.' });
    }
    if (booking.isRated) {
      return res.status(400).json({ message: 'You have already rated this booking.' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    const totalRatings = vehicle.ratings * vehicle.reviewCount;
    const newReviewCount = vehicle.reviewCount + 1;
    const newAverageRating = (totalRatings + rating) / newReviewCount;

    vehicle.ratings = newAverageRating;
    vehicle.reviewCount = newReviewCount;
    await vehicle.save();

    booking.isRated = true;
    await booking.save();

    res.status(200).json({ message: 'Thank you for your rating!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while processing your rating.', error: error.message });
  }
};

module.exports = {
  addVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getMyVehicles,
  rateVehicle,
};
