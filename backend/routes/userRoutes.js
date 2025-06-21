const express = require('express');
const { 
  uploadDocuments,
  getUserProfile,
  updateUserProfile
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Profile routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Document upload route
router.post(
  '/upload-documents',
  protect,
  upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'license', maxCount: 1 }
  ]),
  uploadDocuments
);

module.exports = router;
