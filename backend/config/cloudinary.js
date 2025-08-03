const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary for storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'flexride/vehicles', // A folder in your Cloudinary account to store vehicle images
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }], // Optional: Resize images on upload
  },
});

// Custom storage that keeps buffer for AI validation and uploads to Cloudinary
const customStorage = multer.memoryStorage();

// Middleware that handles AI validation and Cloudinary upload
const uploadWithValidation = multer({ 
  storage: customStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
}).single('image');

// Wrapper function that handles the upload process
const upload = (req, res, next) => {
  uploadWithValidation(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }
    
    if (req.file) {
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload_stream(
          {
            folder: 'flexride/vehicles',
            allowed_formats: ['jpg', 'png', 'jpeg'],
            transformation: [{ width: 800, height: 600, crop: 'limit' }]
          },
          (error, result) => {
            if (error) {
              return res.status(500).json({ message: 'Error uploading to Cloudinary', error: error.message });
            }
            req.file.path = result.secure_url;
            next();
          }
        ).end(req.file.buffer);
      } catch (error) {
        return res.status(500).json({ message: 'Error uploading to Cloudinary', error: error.message });
      }
    } else {
      next();
    }
  });
};

module.exports = upload; 