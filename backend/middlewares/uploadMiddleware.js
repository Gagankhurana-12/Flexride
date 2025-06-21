const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up the destination directory
const destinationDir = 'uploads/vehicles/';

// Ensure the destination directory exists
fs.mkdirSync(destinationDir, { recursive: true });

// Set storage location and filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, destinationDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// Filter file types (PDF/JPG/PNG only)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const isValid = allowed.test(path.extname(file.originalname).toLowerCase());
  if (isValid) cb(null, true);
  else cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

module.exports = upload;
