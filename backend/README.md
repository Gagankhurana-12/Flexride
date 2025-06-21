flexride-backend/
│
├── config/
│   └── db.js                        # MongoDB connection logic
│
├── controllers/
│   ├── authController.js            # Register, login, token handling
│   ├── vehicleController.js         # CRUD for vehicles
│   ├── bookingController.js         # Booking creation & management
│   ├── paymentController.js         # PayPal create & capture logic
│   └── userController.js            # User profile, docs, verification
│
├── middlewares/
│   ├── authMiddleware.js            # JWT validation middleware
│   ├── errorMiddleware.js           # Custom error handling
│   ├── uploadMiddleware.js          # Multer for file uploads
│   └── validateRequest.js           # Schema validation (Joi/Yup)
│
├── models/
│   ├── User.js                      # User schema
│   ├── Vehicle.js                   # Vehicle schema
│   ├── Booking.js                   # Booking schema
│   └── Payment.js                   # Payment tracking schema
│
├── routes/
│   ├── authRoutes.js                # Routes: /api/auth/*
│   ├── vehicleRoutes.js             # Routes: /api/vehicles/*
│   ├── bookingRoutes.js             # Routes: /api/bookings/*
│   ├── paymentRoutes.js             # Routes: /api/payments/*
│   └── userRoutes.js                # Routes: /api/users/*
│
├── utils/
│   ├── jwt.js                       # JWT generation & verification
│   ├── validate.js                  # Joi/Yup schemas
│   ├── emailService.js              # Nodemailer logic (optional)
│   └── paypalClient.js              # PayPal SDK client setup
│
├── uploads/                         # Uploaded files storage (ID proof, licenses, etc.)
│
├── app.js                           # App setup, route mounting, middleware config
├── server.js                        # Server boot entry point
├── .env                             # Secrets: DB, JWT, PayPal
├── .gitignore
├── package.json
└── README.md
