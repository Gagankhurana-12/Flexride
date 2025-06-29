import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Calendar, DollarSign, Star, Plus, Eye, Edit, Trash2, TrendingUp, Users, MapPin, AlertTriangle, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import Button from '../components/Button';
import RatingStars from '../components/RatingStars';
import { format, parseISO, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getBookingStatus = (booking) => {
  if (booking.status === 'cancelled') {
    return 'cancelled';
  }

  const now = new Date();
  const type = booking.bookingType || 'daily';

  if (type === 'hourly') {
    const bookingDate = startOfDay(new Date(booking.startDate));
    const [startH, startM] = (booking.startTime || "00:00").split(":");
    const [endH, endM] = (booking.endTime || "00:00").split(":");

    const startDateTime = new Date(bookingDate.getTime());
    startDateTime.setHours(startH, startM, 0, 0);

    const endDateTime = new Date(bookingDate.getTime());
    endDateTime.setHours(endH, endM, 0, 0);

    if (endDateTime < startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    if (isBefore(now, startDateTime)) return 'upcoming';
    if (isAfter(now, endDateTime)) return 'completed';
    return 'active';

  } else { // Daily
    const startDate = startOfDay(new Date(booking.startDate));
    const endDate = endOfDay(new Date(booking.endDate || booking.startDate));

    if (isBefore(now, startDate)) return 'upcoming';
    if (isAfter(now, endDate)) return 'completed';
    return 'active';
  }
};

const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZDJkNmRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlZlaGljbGU8L3RleHQ+Cjwvc3ZnPgo=';

export default function Dashboard() {
  const { user, token } = useAuth();
  const { unreadCount, setIsChatOpen, conversations } = useChat();
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [vehiclesRes, bookingsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/vehicles/my`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${BACKEND_URL}/api/bookings/my`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!vehiclesRes.ok || !bookingsRes.ok) {
          throw new Error('Failed to fetch dashboard data. Please try again later.');
        }

        const vehiclesData = await vehiclesRes.json();
        const bookingsData = await bookingsRes.json();

        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
        setBookings(Array.isArray(bookingsData) ? bookingsData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)) : []);

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'active':
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending':
      case 'upcoming': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const totalEarnings = bookings
    .filter(b => getBookingStatus(b) === 'completed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const averageRating = vehicles.length > 0
    ? (vehicles.reduce((sum, v) => sum + (v.ratings || 0), 0) / vehicles.length)
    : 0;

  const handleChatClick = () => {
    // Open chat window to show conversations list
    setIsChatOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Could not load dashboard</h2>
        <p className="text-red-500 mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your vehicles today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<DollarSign className="h-6 w-6" />} title="Total Earnings" value={`₹${totalEarnings.toLocaleString()}`} color="blue" />
          <StatCard icon={<Calendar className="h-6 w-6" />} title="Total Bookings" value={bookings.length} color="blue" />
          <StatCard icon={<Car className="h-6 w-6" />} title="Active Listings" value={vehicles.filter(v => v.status === 'active').length} color="blue" />
          <StatCard icon={<Star className="h-6 w-6" />} title="Average Rating" value={averageRating.toFixed(1)} color="yellow" />
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'bookings', 'vehicles'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`capitalize py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab === 'bookings' ? 'Recent Bookings' : tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button as={Link} to="/my-vehicles" variant="outline" className="w-full justify-start" icon={<Plus className="h-5 w-5 mr-2" />}>Add New Vehicle</Button>
                  <Button as={Link} to="/bookings" variant="outline" className="w-full justify-start" icon={<Calendar className="h-5 w-5 mr-2" />}>View All Bookings</Button>
                  <Button onClick={handleChatClick} variant="outline" className="w-full justify-start" icon={<MessageCircle className="h-5 w-5 mr-2" />}>
                    Messages
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                  <Button as={Link} to="/profile" variant="outline" className="w-full justify-start" icon={<Users className="h-5 w-5 mr-2" />}>Update Profile</Button>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {bookings.slice(0, 3).map(b => {
                    const status = getBookingStatus(b);
                    return (
                      <div key={b._id} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 ${getStatusColor(status).split(' ')[0]} rounded-full`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">
                            Booking {status} for {b.vehicle.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(parseISO(b.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {bookings.map((booking) => {
                      const status = getBookingStatus(booking);
                      return (
                        <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 dark:text-white">{booking.vehicle.name}</div></td>
                          <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500 dark:text-gray-400">
                            {booking.startDate ? format(parseISO(booking.startDate), 'MMM d, yyyy') : 'N/A'} - {booking.endDate ? format(parseISO(booking.endDate), 'MMM d, yyyy') : 'N/A'}
                          </div></td>
                          <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 dark:text-white">₹{booking.totalPrice.toLocaleString()}</div></td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className={`capitalize inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>{status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'vehicles' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map(vehicle => (
                  <div key={vehicle._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={vehicle.imageUrl || 'https://via.placeholder.com/400x250/f3f4f6/6b7280?text=No+Image'} alt={vehicle.name} className="w-full h-40 object-cover" />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{vehicle.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{vehicle.location}</p>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">₹{vehicle.pricePerDay}/day</div>
                        <div className="flex items-center space-x-2">
                           <RatingStars rating={vehicle.ratings || 0} size="xs" />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button as={Link} to={`/vehicles/${vehicle._id}`} variant="outline" size="sm" className="flex-1" icon={<Eye className="h-4 w-4 mr-1" />}>View</Button>
                        <Button as={Link} to="/my-vehicles" variant="outline" size="sm" className="flex-1" icon={<Edit className="h-4 w-4 mr-1" />}>Edit</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, title, value, color = 'blue' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/20`}>
        <div className={`text-${color}-600 dark:text-${color}-400`}>{icon}</div>
      </div>
    </div>
  </motion.div>
);