const fetch = require('node-fetch');

// Vehicle-related keywords that indicate a valid vehicle image
const VEHICLE_KEYWORDS = [
  'car', 'automobile', 'vehicle', 'motor vehicle', 'motorcar',
  'motorcycle', 'motorbike', 'bike', 'scooter', 'moped',
  'truck', 'van', 'suv', 'sedan', 'hatchback', 'wagon',
  'convertible', 'coupe', 'limousine', 'pickup', 'jeep',
  'bus', 'minibus', 'taxi', 'cab', 'ambulance', 'fire truck',
  'police car', 'racing car', 'sports car', 'luxury car',
  'electric car', 'hybrid car', 'compact car', 'family car'
];

/**
 * Validates if an image contains a vehicle using Hugging Face's image classification model
 * @param {Buffer} imageBuffer - The image buffer to validate
 * @returns {Promise<boolean>} - True if image contains a vehicle, false otherwise
 */
const validateVehicleImage = async (imageBuffer) => {
  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Hugging Face API endpoint for the google/vit-base-patch16-224 model
    const API_URL = 'https://api-inference.huggingface.co/models/google/vit-base-patch16-224';
    
    // Get API key from environment variables
    const API_KEY = process.env.HUGGING_FACE_API_KEY;
    
    if (!API_KEY) {
      console.warn('HUGGING_FACE_API_KEY not found in environment variables. Skipping AI validation.');
      return true; // Skip validation if no API key
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `data:image/jpeg;base64,${base64Image}`
      })
    });

    if (!response.ok) {
      console.error('Hugging Face API error:', response.status, response.statusText);
      return true; // Skip validation on API error
    }

    const predictions = await response.json();
    
    if (!Array.isArray(predictions) || predictions.length === 0) {
      console.warn('No predictions returned from Hugging Face API');
      return true; // Skip validation if no predictions
    }

    // Check if any of the top predictions contain vehicle-related keywords
    const topPredictions = predictions.slice(0, 5); // Check top 5 predictions
    
    for (const prediction of topPredictions) {
      const label = prediction.label?.toLowerCase() || '';
      const score = prediction.score || 0;
      
      // Check if the label contains any vehicle-related keywords
      const isVehicle = VEHICLE_KEYWORDS.some(keyword => 
        label.includes(keyword.toLowerCase())
      );
      
      // If it's a vehicle and has a reasonable confidence score (>0.3)
      if (isVehicle && score > 0.3) {
        console.log(`Vehicle detected: ${label} (confidence: ${(score * 100).toFixed(2)}%)`);
        return true;
      }
    }

    console.log('No vehicle detected in image. Top predictions:', 
      topPredictions.map(p => `${p.label} (${(p.score * 100).toFixed(2)}%)`).join(', ')
    );
    
    return false;
    
  } catch (error) {
    console.error('Error validating vehicle image:', error);
    return true; // Skip validation on error to avoid blocking uploads
  }
};

module.exports = {
  validateVehicleImage
}; 