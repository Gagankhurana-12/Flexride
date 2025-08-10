# 🚗 FlexRide

**FlexRide** is a **community-driven vehicle rental platform** that connects people who need a ride with those who have vehicles to spare.  
Whether it’s a two-wheeler for a quick trip or a four-wheeler for a weekend getaway — **FlexRide makes renting simple, affordable, and sustainable**.

---

## ✨ Features

- 🔐 **User Authentication** — Secure login & signup with JWT.
- 🚘 **Vehicle Listing & Renting** — Rent or list two-wheelers and four-wheelers.
- 📂 **Category-Based Browsing** — Filter vehicles by type, seats, and transmission.
- 🖼 **Dynamic Vehicle Data** — All listings fetched from a MongoDB backend.
- 🌗 **Light/Dark Mode** — Modern UI with Tailwind CSS.
- 📱 **Responsive Design** — Works seamlessly on desktop, tablet, and mobile.
- 📊 **Vehicle Details Page** — Price per day, seats, transmission type, and description.
- 💬 **Real-Time Chat with Owner** — Contact the vehicle owner instantly.
- 💳 **Secure Payment Integration** — Complete rentals with online transactions.
- 🤖 **AI-Powered Image Validation (Hugging Face)** — Ensures uploaded images are of vehicles only.
- 🛠 **Admin Support** — Add, edit, or remove vehicle listings (future scope).

---

## 🛠 Tech Stack

### **Frontend**
- ⚛️ React.js
- 🎨 Tailwind CSS (Dark/Light mode support)
- 🔄 Axios (API calls)
- 🗺 React Router DOM (Navigation)
- 💬 Socket.io Client (Real-time chat)
- 💳 Stripe.js / Razorpay.js (Payment processing)

### **Backend**
- 🟢 Node.js
- 🚂 Express.js
- 🍃 MongoDB + Mongoose (Database)
- 🔑 JWT Authentication
- 🌍 RESTful API Architecture
- 💬 Socket.io (Chat server)
- 🤖 **Hugging Face Inference API** (AI image classification)

---

## 📂 Project Structure

```plaintext
flexride/
├── frontend/                 # React + Tailwind frontend
│   ├── src/
│   │   ├── components/       # Navbar, VehicleCard, Footer, ChatBox, PaymentForm, etc.
│   │   ├── pages/            # Home, About, Contact, Login, Signup, VehicleDetails
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── backend/                  # Node + Express backend
│   ├── controllers/          # authController.js, vehicleController.js, chatController.js, paymentController.js
│   ├── models/               # User.js, Vehicle.js, Message.js
│   ├── routes/               # authRoutes.js, vehicleRoutes.js, chatRoutes.js, paymentRoutes.js
│   ├── config/               # db.js, paymentConfig.js, huggingfaceConfig.js
│   ├── middleware/           # authMiddleware.js, imageValidationMiddleware.js
│   ├── server.js
│   └── package.json
│
└── README.md
