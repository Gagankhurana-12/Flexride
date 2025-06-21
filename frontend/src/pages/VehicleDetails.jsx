import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Car, 
  Fuel, 
  Users, 
  Calendar, 
  Shield, 
  Phone, 
  Mail,
  Heart,
  Share2,
  CheckCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import BookingCalendar from '../components/BookingCalendar';
import RatingStars from '../components/RatingStars';
// import PayPalButton from '../components/PayPalButton'; // We will handle booking directly
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { isSameDay, startOfToday } from 'date-fns';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// We will remove the mockVehicle object and fetch data instead.

export default function VehicleDetails() {
  const { id } = useParams();
  const { user, token } = useAuth(); // Get token for API calls
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [bookingType, setBookingType] = useState('daily'); // 'daily' or 'hourly'
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  const hourlyPrice = vehicle?.pricePerHour || (vehicle ? Math.round(vehicle.pricePerDay / 10) : 0);
  
  const timeSlots = useMemo(() => Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`), []);

  const availableStartTimes = useMemo(() => {
    if (!selectedDates.start || !isSameDay(selectedDates.start, startOfToday())) {
      return timeSlots.slice(0, -1); // All day except midnight for end time
    }
    const currentHour = new Date().getHours();
    return timeSlots.filter(time => parseInt(time.split(':')[0]) > currentHour).slice(0, -1);
  }, [selectedDates.start, timeSlots]);

  const availableEndTimes = useMemo(() => {
    const startHour = parseInt(startTime.split(':')[0]);
    return timeSlots.filter(time => parseInt(time.split(':')[0]) > startHour);
  }, [startTime, timeSlots]);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/vehicles/${id}`);
        if (!response.ok) {
          throw new Error('Vehicle not found');
        }
        const data = await response.json();
        setVehicle(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);
  
  useEffect(() => {
    // When booking type changes, reset dates to avoid invalid states
    setSelectedDates({ start: null, end: null });
  }, [bookingType]);

  const handleDateSelect = (date) => {
    if (bookingType === 'hourly') {
      setSelectedDates({ start: date, end: date });
      return;
    }

    const { start, end } = selectedDates;

    if (!start || end) {
      // If no start date is set, or if a range is already complete, start a new selection.
      setSelectedDates({ start: date, end: null });
    } else if (isSameDay(date, start)) {
      // If the same date is clicked again, deselect it.
      setSelectedDates({ start: null, end: null });
    } else if (date < start) {
      // If a date before the start date is clicked, start a new selection.
      setSelectedDates({ start: date, end: null });
    } else {
      // Otherwise, set the end date.
      setSelectedDates({ start, end: date });
    }
  };

  const calculateTotal = () => {
    if (!vehicle || !selectedDates.start) {
      return { days: 0, hours: 0, subtotal: 0, tax: 0, total: 0 };
    }

    if (bookingType === 'hourly') {
      const start = parseInt(startTime.split(':')[0], 10);
      const end = parseInt(endTime.split(':')[0], 10);
      const hours = end > start ? end - start : 0;
      const subtotal = hours * hourlyPrice;
      const tax = subtotal * 0.18;
      const total = subtotal + tax;
      return { days: 0, hours, subtotal, tax, total };
    } else { // daily
      if (!selectedDates.end) return { days: 1, hours: 0, subtotal: vehicle.pricePerDay, tax: vehicle.pricePerDay * 0.18, total: vehicle.pricePerDay * 1.18 };
      const days = Math.ceil((new Date(selectedDates.end) - new Date(selectedDates.start)) / (1000 * 60 * 60 * 24)) + 1;
      const subtotal = days * (vehicle.pricePerDay || 0);
      const tax = subtotal * 0.18; // 18% GST
      const total = subtotal + tax;
      return { days, hours: 0, subtotal, tax, total };
    }
  };

  const handleBooking = async () => {
    if (!user) {
      addNotification('Please login to book a vehicle.', 'warning');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (!selectedDates.start) {
      addNotification('Please select a booking date', 'warning');
      return;
    }
    if (bookingType === 'daily' && !selectedDates.end) {
      addNotification('Please select an end date for daily booking', 'warning');
      return;
    }
    
    if (bookingType === 'hourly') {
        if (isSameDay(selectedDates.start, startOfToday())) {
            const currentHour = new Date().getHours();
            const startHour = parseInt(startTime.split(':')[0]);
            if (startHour <= currentHour) {
                addNotification('You cannot book a time that has already passed today.', 'error');
                return;
            }
        }
    }
    
    const { total } = calculateTotal();

    const bookingData = {
      vehicle: vehicle._id,
      startDate: selectedDates.start,
      totalPrice: total,
      bookingType,
    };

    if (bookingType === 'daily') {
      bookingData.endDate = selectedDates.end;
    } else { // hourly
      bookingData.startTime = startTime;
      bookingData.endTime = endTime;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking.');
      }

      addNotification('Booking created successfully! You will be redirected shortly.', 'success');
      
      // Redirect to my bookings page after a short delay
      setTimeout(() => {
        // We might need to use react-router-dom's history/navigate for this
        window.location.href = '/bookings';
      }, 2000);

    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  const { days, hours, subtotal, tax, total } = calculateTotal();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Link
            to="/vehicles"
            className="inline-flex items-center text-primary-500 hover:text-primary-600"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Vehicles
          </Link>
        </div>
      </div>
    );
  }
  
  // No vehicle found
  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">🚗</div>
          <p className="text-gray-500 mb-4">Vehicle not found.</p>
          <Link
            to="/vehicles"
            className="inline-flex items-center text-primary-500 hover:text-primary-600"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Vehicles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/vehicles"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Vehicles
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="relative mb-6 rounded-2xl overflow-hidden shadow-lg">
              <img
                src={vehicle.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzY2NzM4NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'}
                alt={vehicle.name}
                className="w-full h-96 object-cover"
              />
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-2 rounded-full transition-colors ${
                    isLiked 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/80 text-gray-700 hover:bg-white'
                  }`}
                >
                  <Heart className="h-5 w-5" fill={isLiked ? 'currentColor' : 'none'} />
                </button>
                <button className="p-2 bg-white/80 text-gray-700 rounded-full hover:bg-white transition-colors">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {vehicle.name}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {vehicle.location || 'Location not specified'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{vehicle.pricePerDay?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    per day
                  </div>
                </div>
              </div>

              {/* Vehicle Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Car className="h-6 w-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {vehicle.category}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {vehicle.year || 'N/A'}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Fuel className="h-6 w-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {vehicle.fuelType || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {vehicle.mileage || 'N/A'}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {vehicle.seats} Seats
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {vehicle.transmission}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Insured
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Protected
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Description
                </h3>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {vehicle.description || 'No description available.'}
                </p>
              </div>

              {/* Features */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Features</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-gray-700 dark:text-gray-300">
                  <div className="flex items-center"><Car className="h-5 w-5 mr-2 text-primary-500"/>{vehicle.category}</div>
                  <div className="flex items-center"><Fuel className="h-5 w-5 mr-2 text-primary-500"/>{vehicle.fuelType || 'N/A'}</div>
                  <div className="flex items-center"><Users className="h-5 w-5 mr-2 text-primary-500"/>{vehicle.seats} Seats</div>
                  <div className="flex items-center"><Shield className="h-5 w-5 mr-2 text-primary-500"/>{vehicle.transmission}</div>
                  <div className="flex items-center"><Calendar className="h-5 w-5 mr-2 text-primary-500"/>Year {vehicle.year || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Owner Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Meet the Owner</h2>
              <div className="flex items-center space-x-4">
                <img 
                  src={vehicle.user?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI3NSIgZmlsbD0iIzM0NzM4YSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VTwvdGV4dD4KPC9zdmc+Cg=='} 
                  alt={vehicle.user?.name || 'Owner'}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <div className="font-bold text-gray-800 dark:text-white">{vehicle.user?.name || 'Unknown Owner'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Joined in {vehicle.user?.createdAt ? new Date(vehicle.user.createdAt).getFullYear() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Book this vehicle</h2>
              
              {/* Booking Type Toggle */}
              <div className="mb-6">
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setBookingType('daily')}
                    className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${
                      bookingType === 'daily' ? 'bg-blue-500 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Daily Rental
                  </button>
                  <button
                    onClick={() => setBookingType('hourly')}
                    className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${
                      bookingType === 'hourly' ? 'bg-blue-500 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Hourly Rental
                  </button>
                </div>
              </div>

              {/* Calendar */}
              <BookingCalendar
                onDateSelect={handleDateSelect}
                selectedDates={selectedDates}
                bookingType={bookingType}
              />

              {/* Time Selection for Hourly */}
              <AnimatePresence>
                {bookingType === 'hourly' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="mt-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                        <select
                          id="startTime"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {availableStartTimes.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                        <select
                          id="endTime"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {availableEndTimes.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Price Calculation */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>
                    {bookingType === 'daily' 
                      ? `₹${vehicle.pricePerDay.toLocaleString() || 0} x ${days} ${days === 1 ? 'day' : 'days'}`
                      : `₹${hourlyPrice.toLocaleString() || 0} x ${hours} ${hours === 1 ? 'hour' : 'hours'}`
                    }
                  </span>
                  <span>₹{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Tax (18%)</span>
                  <span>₹{tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white mt-2">
                  <span>Total</span>
                  <span>₹{total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>

              {/* Book Now Button */}
              <div className="mt-6">
                <Button 
                  onClick={handleBooking}
                  className="w-full"
                  disabled={!selectedDates.start || !selectedDates.end}
                >
                  Book Now
                </Button>
              </div>

              <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
                You won't be charged yet
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}