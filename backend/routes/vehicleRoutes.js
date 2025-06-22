const express = require('express');
const {
  addVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getMyVehicles,
  rateVehicle,
  updateVehicleStatus
} = require('../controllers/vehicleController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../config/cloudinary');

const router = express.Router();

// ✅ Place this BEFORE `/:id` to prevent route conflict
router.get('/my', protect, getMyVehicles);

// Public routes
router.get('/', getVehicles);
router.get('/:id', getVehicleById);

// Protected CRUD routes
router.post('/', protect, upload.single('image'), addVehicle);
router.put('/:id', protect, upload.single('image'), updateVehicle);
router.delete('/:id', protect, deleteVehicle);
router.post('/:vehicleId/bookings/:bookingId/rate', protect, rateVehicle);

// Route to update vehicle status
router.patch('/:id/status', protect, updateVehicleStatus);

module.exports = router;