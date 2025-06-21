const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // to know who added the vehicle
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String, // e.g., "Two-Wheeler", "Four-Wheeler"
    required: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  pricePerDay: {
    type: Number,
    required: true,
  },
  pricePerHour: {
    type: Number,
  },
  seats: {
    type: Number,
    required: true,
  },
  transmission: {
    type: String, // e.g., "Manual", "Automatic"
    required: true,
  },
  fuelType: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  ratings: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
