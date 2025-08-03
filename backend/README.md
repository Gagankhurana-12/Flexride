# FlexRide Backend

## AI Image Validation Setup

This backend now includes AI-powered image validation using Hugging Face's image classification model. Before uploading vehicle images to Cloudinary, the system validates that the image actually contains a vehicle.

### Environment Variables Required

Add the following to your `.env` file:

```env
# Existing variables
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# New variable for AI validation
HUGGING_FACE_API_KEY=your_hugging_face_api_key
```

### How to Get Hugging Face API Key

1. Go to [Hugging Face](https://huggingface.co/)
2. Create an account or sign in
3. Go to your profile settings
4. Navigate to "Access Tokens"
5. Create a new token with "read" permissions
6. Copy the token and add it to your `.env` file

### How It Works

1. When a user uploads an image for a vehicle, it's first stored in memory as a buffer
2. The image buffer is sent to Hugging Face's `google/vit-base-patch16-224` model for classification
3. The AI model analyzes the image and returns predictions with confidence scores
4. The system checks if any of the top predictions contain vehicle-related keywords
5. If a vehicle is detected with reasonable confidence (>30%), the image is uploaded to Cloudinary
6. If no vehicle is detected, a 400 error is returned with a helpful message

### Vehicle Keywords Recognized

The system recognizes various vehicle types including:
- car, automobile, vehicle, motor vehicle
- motorcycle, motorbike, bike, scooter, moped
- truck, van, suv, sedan, hatchback, wagon
- convertible, coupe, limousine, pickup, jeep
- bus, minibus, taxi, cab, ambulance, fire truck
- police car, racing car, sports car, luxury car
- electric car, hybrid car, compact car, family car

### Error Handling

- If the Hugging Face API key is not provided, validation is skipped (uploads work normally)
- If the API is unavailable or returns errors, validation is skipped to avoid blocking uploads
- Clear error messages are provided to users when validation fails

### API Endpoints

The AI validation is automatically applied to:
- `POST /api/vehicles` - Adding new vehicles
- `PUT /api/vehicles/:id` - Updating existing vehicles

### Testing

To test the AI validation:
1. Try uploading a clear vehicle image - should work normally
2. Try uploading a non-vehicle image (person, building, etc.) - should return validation error
3. Check the server logs for AI validation results and confidence scores
