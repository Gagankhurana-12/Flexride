const multer = require('multer');

// Configure multer for user document uploads (multiple fields)
const userUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

module.exports = {
  userUpload
}; 