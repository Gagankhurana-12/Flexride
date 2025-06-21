import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Car, MapPin, Search, Tag, User, Hash, AlertTriangle, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';
import RatingStars from '../components/RatingStars';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { format, isBefore, isAfter, isToday, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZDJkNmRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlZlaGljbGU8L3RleHQ+Cjwvc3ZnPgo=';
const fallbackAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2EwYTVhZCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzIiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5VPC90ZXh0Pgo8L3N2Zz4K';

const Bookings = () => {
  const { token } = useAuth();
  const { addNotification } = useNotification();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [currentBookingForRating, setCurrentBookingForRating] = useState(null);

  const [activeFilter, setActiveFilter] = useState('Upcoming');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    if (!token) {
      setIsLoading(false);
      setError('You must be logged in to view bookings.');
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    setIsCancelling(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to cancel booking');
      await fetchBookings(); // Refetch bookings to update the list
      setSelectedBooking(null); // Close the modal
    } catch (err) {
      console.error("Cancellation failed", err);
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (selectedRating === 0) {
      addNotification('Please select a rating from 1 to 5 stars.', 'warning');
      return;
    }
    setIsRating(true);
    try {
      const { vehicle, _id: bookingId } = currentBookingForRating;
      const res = await fetch(`${BACKEND_URL}/api/vehicles/${vehicle._id}/bookings/${bookingId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: selectedRating }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit rating.');
      
      addNotification('Rating submitted successfully!', 'success');
      setRatingModalOpen(false);
      fetchBookings(); // Refresh bookings to update UI
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setIsRating(false);
    }
  };

  const categorizedBookings = useMemo(() => {
    const categories = {
      Upcoming: [],
      Active: [],
      Completed: [],
      Cancelled: [],
    };
    const now = new Date();

    bookings.forEach(booking => {
      if (booking.status === 'cancelled') {
        categories.Cancelled.push(booking);
        return;
      }

      const type = booking.bookingType || 'daily';

      if (type === 'hourly') {
        const startDate = new Date(booking.startDate);
        const [startH, startM] = (booking.startTime || "00:00").split(":");
        const [endH, endM] = (booking.endTime || "00:00").split(":");

        const startDateTime = new Date(startDate);
        startDateTime.setHours(startH, startM, 0, 0);

        const endDateTime = new Date(startDate);
        endDateTime.setHours(endH, endM, 0, 0);

        if (isBefore(now, startDateTime)) {
          categories.Upcoming.push(booking);
        } else if (isAfter(now, endDateTime)) {
          categories.Completed.push(booking);
        } else {
          categories.Active.push(booking);
        }

      } else { // Daily booking
        const startDate = new Date(booking.startDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = booking.endDate ? new Date(booking.endDate) : new Date(booking.startDate);
        endDate.setHours(23, 59, 59, 999);
        
        if (isBefore(now, startDate)) {
            categories.Upcoming.push(booking);
        } else if (isAfter(now, endDate)) {
            categories.Completed.push(booking);
        } else {
            categories.Active.push(booking);
        }
      }
    });
    return categories;
  }, [bookings]);

  const filteredBookings = categorizedBookings[activeFilter] || [];

  const renderBookingCard = (booking) => {
    const { vehicle } = booking;
    
    return (
      <motion.div
        key={booking._id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
      >
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="flex-shrink-0">
            <img
              src={booking.vehicle?.imageUrl || 'https://via.placeholder.com/150x100/f3f4f6/6b7280?text=No+Image'}
              alt={booking.vehicle?.name || 'Vehicle image'}
              className="h-24 w-36 rounded-lg object-cover"
            />
          </div>
          <div className="flex-grow">
            <p className="text-sm text-gray-500 dark:text-gray-400">{vehicle.category}</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{vehicle.name}</h3>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              {booking.bookingType === 'hourly' ? (
                <span>{`${format(new Date(booking.startDate), 'MMM d, yyyy')} (${booking.startTime} - ${booking.endTime})`}</span>
              ) : (
                <>
                  <span>{booking.startDate ? format(new Date(booking.startDate), 'MMM d, yyyy') : 'N/A'}</span>
                  <span className="mx-2">-</span>
                  <span>{booking.endDate ? format(new Date(booking.endDate), 'MMM d, yyyy') : 'N/A'}</span>
                </>
              )}
            </div>
          </div>
          <div className="w-full sm:w-auto flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center pt-4 sm:pt-0 border-t sm:border-t-0 sm:pl-6 sm:border-l border-gray-200 dark:border-gray-700 space-y-0 sm:space-y-2">
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              ₹{booking.totalPrice.toLocaleString()}
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedBooking(booking)}>
              View Details
            </Button>
            {booking.status === 'completed' && !booking.isRated && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCurrentBookingForRating(booking);
                  setSelectedRating(0);
                  setRatingModalOpen(true);
                }}
              >
                Rate Now
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) return <div className="text-center py-10">Loading your bookings...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Bookings</h1>

          <BookingFilter
            filters={categorizedBookings}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />

          <div className="space-y-6">
            <AnimatePresence>
              {filteredBookings.length > 0 ? (
                filteredBookings.map(renderBookingCard)
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <p className="text-gray-500 dark:text-gray-400">
                    You have no {activeFilter.toLowerCase()} bookings.
                  </p>
                  {activeFilter === 'Upcoming' && (
                     <Button as={Link} to="/vehicles" className="mt-4">
                      Browse Vehicles
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <BookingDetailsModal 
        booking={selectedBooking} 
        onClose={() => setSelectedBooking(null)} 
        onCancelBooking={handleCancelBooking}
        isCancelling={isCancelling}
      />
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        onSubmit={handleRatingSubmit}
        rating={selectedRating}
        setRating={setSelectedRating}
        isSubmitting={isRating}
      />
    </>
  );
}

const BookingFilter = ({ filters, activeFilter, setActiveFilter }) => (
  <div className="flex space-x-2 sm:space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6">
    {Object.keys(filters).map((filter) => (
      <button
        key={filter}
        onClick={() => setActiveFilter(filter)}
        className={`px-3 py-3 text-sm sm:text-base font-medium transition-colors duration-200 focus:outline-none border-b-2 ${
          activeFilter === filter
            ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
        }`}
      >
        <span>{filter}</span>
        <span
          className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
            activeFilter === filter
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200'
          }`}
        >
          {filters[filter].length}
        </span>
      </button>
    ))}
  </div>
);

const BookingDetailsModal = ({ booking, onClose, onCancelBooking, isCancelling }) => {
  if (!booking) return null;
  const { vehicle } = booking;

  const getStatusInfo = (booking) => {
    const now = new Date();
    if (booking.status === 'cancelled') {
      return { text: 'Cancelled', icon: XCircle, classes: 'bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-400' };
    }
    if (new Date(booking.startDate) > now) {
      return { text: 'Upcoming', icon: Clock, classes: 'bg-blue-100 text-blue-700 dark:bg-blue-700/20 dark:text-blue-400' };
    }
    if (booking.endDate && new Date(booking.endDate) < now) {
      return { text: 'Completed', icon: CheckCircle, classes: 'bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400' };
    }
    return { text: 'Active', icon: Car, classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/20 dark:text-yellow-400' };
  };

  const status = getStatusInfo(booking);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{vehicle.name}</h2>
                <p className="text-base text-gray-500 dark:text-gray-400">{vehicle.category}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full flex-shrink-0">
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 sm:gap-8">
              <div className="md:col-span-3">
                <img
                  src={vehicle.imageUrl ? `${BACKEND_URL}${vehicle.imageUrl}` : fallbackImage}
                  alt={vehicle.name}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Status</span>
                    <span className={`flex items-center font-medium px-3 py-1 rounded-full text-sm ${status.classes}`}>
                      <status.icon className="w-5 h-5 mr-2" />
                      {status.text}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Booking ID</span>
                    <span className="text-base text-gray-500 dark:text-gray-400 font-mono">#{booking._id.slice(-8)}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div>
                    <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Booking Summary</h3>
                    {booking.bookingType === 'hourly' ? (
                      <div className="space-y-2 text-base">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-gray-400">Date:</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{format(new Date(booking.startDate), 'eee, MMM d')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-gray-400">Time:</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{`${booking.startTime} - ${booking.endTime}`}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-base">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-gray-400">From:</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{booking.startDate ? format(new Date(booking.startDate), 'eee, MMM d') : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-gray-400">To:</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{booking.endDate ? format(new Date(booking.endDate), 'eee, MMM d') : 'N/A'}</span>
                        </div>
                      </div>
                    )}
                </div>
                
                <div>
                    <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Price Breakdown</h3>
                    <div className="text-base space-y-2 text-gray-600 dark:text-gray-300">
                       <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          {booking.bookingType === 'hourly' ? 'Price per hour:' : 'Price per day:'}
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-100">
                          ₹{booking.bookingType === 'hourly' 
                            ? (vehicle.pricePerHour || Math.round(vehicle.pricePerDay / 10)).toLocaleString() 
                            : vehicle.pricePerDay.toLocaleString()
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Tax (18%):</span>
                        <span className="font-medium text-gray-800 dark:text-gray-100">₹{(booking.totalPrice - booking.totalPrice / 1.18).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
                      <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-gray-50">
                        <span>Total Paid:</span>
                        <span>₹{booking.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                </div>
                
                <div>
                    <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Owner Details</h3>
                    <div className="flex items-center space-x-3 mt-4">
                      <img 
                        src={vehicle.user?.avatar || fallbackAvatar}
                        alt={vehicle.user?.name} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{vehicle.user?.name}</span>
                    </div>
                </div>
              </div>
            </div>
            
            {status.text === 'Upcoming' && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <Button 
                  variant="destructive" 
                  onClick={() => onCancelBooking(booking._id)}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const RatingModal = ({ isOpen, onClose, onSubmit, rating, setRating, isSubmitting }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Rate Your Experience</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Your feedback helps us improve. Please select a star rating for your booking.</p>
          <div className="flex justify-center mb-8">
            <RatingStars
              interactive
              totalStars={5}
              size="lg"
              rating={rating}
              onRatingChange={setRating}
              showNumber={false}
            />
          </div>
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Bookings;