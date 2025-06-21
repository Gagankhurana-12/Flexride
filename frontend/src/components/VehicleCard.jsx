import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Car, Fuel, Users, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VehicleCard({ vehicle, onBook }) {
  const {
    _id,
    name,
    pricePerDay,
    rating = 4.5,
    reviewCount = 0,
    location,
    imageUrl,
    category,
    fuelType,
    seats,
    status,
    user
  } = vehicle;

  const { user: authUser } = useAuth();

  const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzY2NzM4NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
  
  const ownerName = user ? user.name : 'Owner';
  const avatarUrl = user && user.avatar 
    ? user.avatar 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=random&color=fff&length=1`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
    >
      <div className="relative">
        <img
          src={imageUrl || fallbackImage}
          alt={name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {status !== 'active' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Not Available
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm">
            {category}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
            {name}
          </h3>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {rating} ({reviewCount})
            </span>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          {location}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <Fuel className="h-4 w-4 mr-1" />
              {fuelType}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {seats}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ₹{pricePerDay}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              per day
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={avatarUrl}
              alt={ownerName}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {ownerName}
            </span>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/vehicles/${_id}`}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              View Details
            </Link>
            {status === 'active' && (
              <Link to={`/vehicles/${_id}`}>
                <button
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Book Now
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}