import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VehicleCard from '../components/VehicleCard';
import Button from '../components/Button';
import Input from '../components/Input';

export default function VehicleListings() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    type: '',
    priceRange: [0, 5000],
    fuelType: '',
    transmission: '',
    available: false
  });

  const vehicleTypes = ['Sedan', 'Hatchback', 'SUV', 'Motorcycle', 'Sports Bike', 'Electric SUV'];
  const fuelTypes = ['Petrol', 'Diesel', 'Electric'];
  const transmissionTypes = ['Manual', 'Automatic'];

  useEffect(() => {
    // Fetch all vehicles from the backend
    fetch('/api/vehicles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setVehicles(data);
          setFilteredVehicles(data); // Initially, all vehicles are shown
        }
      })
      .catch(err => console.error("Failed to fetch vehicles:", err));
  }, []);

  useEffect(() => {
    let filtered = vehicles.filter(vehicle => {
      const matchesSearch = (vehicle.name || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                           (vehicle.location || '').toLowerCase().includes(filters.search.toLowerCase());
      const matchesLocation = !filters.location || (vehicle.location || '').toLowerCase().includes(filters.location.toLowerCase());
      const matchesType = !filters.type || vehicle.category === filters.type;
      const matchesPrice = vehicle.pricePerDay >= filters.priceRange[0] && vehicle.pricePerDay <= filters.priceRange[1];
      const matchesFuel = !filters.fuelType || vehicle.fuelType === filters.fuelType;
      const matchesTransmission = !filters.transmission || vehicle.transmission === filters.transmission;
      const matchesAvailable = !filters.available || vehicle.status === 'active';

      return matchesSearch && matchesLocation && matchesType && matchesPrice && 
             matchesFuel && matchesTransmission && matchesAvailable;
    });

    setFilteredVehicles(filtered);
  }, [filters, vehicles]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      type: '',
      priceRange: [0, 5000],
      fuelType: '',
      transmission: '',
      available: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Browse Vehicles
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find the perfect vehicle for your next adventure
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search vehicles or location..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                icon={<Search className="h-5 w-5" />}
              />
            </div>

            {/* Location */}
            <div className="lg:w-64">
              <Input
                placeholder="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                icon={<MapPin className="h-5 w-5" />}
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              icon={<SlidersHorizontal className="h-5 w-5" />}
              className="lg:w-auto"
            >
              Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Vehicle Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vehicle Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Types</option>
                      {vehicleTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fuel Type
                    </label>
                    <select
                      value={filters.fuelType}
                      onChange={(e) => handleFilterChange('fuelType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Fuel Types</option>
                      {fuelTypes.map(fuel => (
                        <option key={fuel} value={fuel}>{fuel}</option>
                      ))}
                    </select>
                  </div>

                  {/* Transmission */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Transmission
                    </label>
                    <select
                      value={filters.transmission}
                      onChange={(e) => handleFilterChange('transmission', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Transmissions</option>
                      {transmissionTypes.map(trans => (
                        <option key={trans} value={trans}>{trans}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price Range (₹{filters.priceRange[0]} - ₹{filters.priceRange[1]})
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="100"
                      value={filters.priceRange[1]}
                      onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value, 10)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>

                  {/* Availability */}
                  <div className="flex items-center justify-center">
                    <label htmlFor="available-only" className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="available-only"
                        checked={filters.available}
                        onChange={(e) => handleFilterChange('available', e.target.checked)}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Available Now</span>
                    </label>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <Button variant="ghost" onClick={clearFilters} className="w-full">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {filteredVehicles.length} vehicles found
          </p>
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white">
            <option>Sort by: Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Rating: High to Low</option>
            <option>Newest First</option>
          </select>
        </div>

        {/* Vehicle Grid */}
        {filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <VehicleCard vehicle={vehicle} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No vehicles found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}