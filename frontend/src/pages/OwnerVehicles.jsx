import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Car, 
  MapPin, 
  Star, 
  Calendar,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Search,
  Filter,
  Upload,
  X,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Button from '../components/Button';
import RatingStars from '../components/RatingStars';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function OwnerVehicles() {
  const { addNotification } = useNotification();
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  // State for the form fields
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formType, setFormType] = useState('');
  const [formFuelType, setFormFuelType] = useState('');
  const [formSeats, setFormSeats] = useState('');
  const [formTransmission, setFormTransmission] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMyVehicles = () => {
    const token = localStorage.getItem('flexride_token');
    fetch(`${BACKEND_URL}/api/vehicles/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    })
    .then(data => {
      setVehicles(Array.isArray(data) ? data : []);
    })
    .catch(() => {
      addNotification('Could not fetch your vehicles.', 'error');
      setVehicles([]);
    });
  };

  useEffect(() => {
    fetchMyVehicles();
  }, []);

  const handleEditClick = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormTitle(vehicle.name || '');
    setFormPrice(vehicle.pricePerDay || '');
    setFormLocation(vehicle.location || '');
    setFormType(vehicle.category || '');
    setFormFuelType(vehicle.fuelType || '');
    setFormSeats(vehicle.seats || '');
    setFormTransmission(vehicle.transmission || '');
    setFormDescription(vehicle.description || '');
    setFormImage(null);
    setImagePreview(vehicle.imageUrl ? vehicle.imageUrl : null);
    setShowAddModal(true);
  };

  const handleAddClick = () => {
    setEditingVehicle(null);
    setFormTitle('');
    setFormPrice('');
    setFormLocation('');
    setFormType('');
    setFormFuelType('');
    setFormSeats('');
    setFormTransmission('');
    setFormDescription('');
    setFormImage(null);
    setImagePreview(null);
    setShowAddModal(true);
  };
  
  const closeAndResetModal = () => {
    setShowAddModal(false);
    setEditingVehicle(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormImage(null);
    setImagePreview(null);
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      const token = localStorage.getItem('flexride_token');
      try {
        const res = await fetch(`${BACKEND_URL}/api/vehicles/${vehicleId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to delete vehicle');
        }
        addNotification('Vehicle deleted successfully', 'success');
        fetchMyVehicles(); // Re-fetch to update list
      } catch (err) {
        addNotification(err.message || 'Could not delete vehicle', 'error');
      }
    }
  };

  const handleStatusToggle = async (vehicleId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const token = localStorage.getItem('flexride_token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/vehicles/${vehicleId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
      addNotification('Vehicle status updated successfully', 'success');
      // Update local state to reflect change immediately
      setVehicles(prev => prev.map(v => v._id === vehicleId ? { ...v, status: newStatus } : v));
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('name', formTitle);
    formData.append('category', formType);
    formData.append('description', formDescription);
    formData.append('pricePerDay', formPrice);
    formData.append('seats', formSeats);
    formData.append('transmission', formTransmission);
    formData.append('fuelType', formFuelType);
    formData.append('location', formLocation);
    if (formImage) {
      formData.append('image', formImage);
    }

    const token = localStorage.getItem('flexride_token');
    const isEditing = !!editingVehicle;
    const url = isEditing ? `${BACKEND_URL}/api/vehicles/${editingVehicle._id}` : `${BACKEND_URL}/api/vehicles`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'add'} vehicle`);
      }
      addNotification(`Vehicle ${isEditing ? 'updated' : 'added'} successfully!`, 'success');
      closeAndResetModal();
      fetchMyVehicles();
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const title = vehicle.name || '';
    const location = vehicle.location || '';
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || (vehicle.status || 'active') === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzY2NzM4NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Vehicles</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your vehicle listings and track performance</p>
          </div>
          <Button onClick={handleAddClick} icon={<Plus className="h-5 w-5" />}>Add Vehicle</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stats Cards Here */}
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="relative">
                  <img
                    src={vehicle.imageUrl ? vehicle.imageUrl : fallbackImage}
                    alt={vehicle.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      vehicle.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {vehicle.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{vehicle.name}</h3>
                    <div className="flex items-center space-x-1">
                      <RatingStars rating={vehicle.ratings || 0} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">({vehicle.reviewCount || 0})</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{vehicle.location || 'Location not specified'}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Car className="h-4 w-4 mr-2" />
                      <span>{vehicle.category}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>₹{vehicle.pricePerDay}/day</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(vehicle)}
                      icon={<Edit className="h-4 w-4" />}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteVehicle(vehicle._id)}
                      icon={<Trash2 className="h-4 w-4" />}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <Car className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No vehicles found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {vehicles.length === 0 ? 'You haven\'t added any vehicles yet.' : 'No vehicles match your search criteria.'}
            </p>
            {vehicles.length === 0 && (
              <Button onClick={handleAddClick} icon={<Plus className="h-5 w-5" />}>
                Add Your First Vehicle
              </Button>
            )}
          </div>
        )}

        {/* Enhanced Add/Edit Vehicle Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {editingVehicle ? 'Update your vehicle information' : 'Create a new vehicle listing'}
                      </p>
                    </div>
                    <button
                      onClick={closeAndResetModal}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <X className="h-6 w-6 text-gray-500" />
                    </button>
                  </div>

                  <form onSubmit={handleVehicleSubmit} className="space-y-6">
                    {/* Photo Upload Section */}
                    <div className="space-y-4">
                      <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                        Vehicle Photo
                      </label>
                      <div className="flex items-center space-x-6">
                        {/* Photo Preview */}
                        <div className="relative">
                          <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                            {imagePreview ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={imagePreview}
                                  alt="Vehicle preview"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={removeImage}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No image</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Upload Button */}
                        <div className="flex-1">
                          <label className="cursor-pointer">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {imagePreview ? 'Change Photo' : 'Upload Vehicle Photo'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG up to 10MB
                              </p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields in Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Vehicle Title */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Vehicle Title *
                        </label>
                        <input
                          value={formTitle}
                          onChange={e => setFormTitle(e.target.value)}
                          placeholder="e.g., Honda City 2022"
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors"
                        />
                      </div>

                      {/* Price per Day */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Price per Day (₹) *
                        </label>
                        <input
                          type="number"
                          value={formPrice}
                          onChange={e => setFormPrice(e.target.value)}
                          placeholder="1000"
                          required
                          min="0"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors"
                        />
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Location *
                        </label>
                        <input
                          value={formLocation}
                          onChange={e => setFormLocation(e.target.value)}
                          placeholder="e.g., Mumbai, Maharashtra"
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors"
                        />
                      </div>

                      {/* Vehicle Type */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Vehicle Type *
                        </label>
                        <select
                          value={formType}
                          onChange={e => setFormType(e.target.value)}
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors"
                        >
                          <option value="">Select Type</option>
                          <option value="Sedan">Sedan</option>
                          <option value="Hatchback">Hatchback</option>
                          <option value="SUV">SUV</option>
                          <option value="Motorcycle">Motorcycle</option>
                          <option value="Scooter">Scooter</option>
                          <option value="Sports Bike">Sports Bike</option>
                          <option value="Electric SUV">Electric SUV</option>
                        </select>
                      </div>

                      {/* Fuel Type */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Fuel Type *
                        </label>
                        <select
                          value={formFuelType}
                          onChange={e => setFormFuelType(e.target.value)}
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors"
                        >
                          <option value="">Select Fuel Type</option>
                          <option value="Petrol">Petrol</option>
                          <option value="Diesel">Diesel</option>
                          <option value="Electric">Electric</option>
                        </select>
                      </div>

                      {/* Number of Seats */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Number of Seats *
                        </label>
                        <input
                          type="number"
                          value={formSeats}
                          onChange={e => setFormSeats(e.target.value)}
                          placeholder="5"
                          required
                          min="1"
                          max="20"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors"
                        />
                      </div>

                      {/* Transmission */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Transmission *
                        </label>
                        <select
                          value={formTransmission}
                          onChange={e => setFormTransmission(e.target.value)}
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors"
                        >
                          <option value="">Select Transmission</option>
                          <option value="Manual">Manual</option>
                          <option value="Automatic">Automatic</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </label>
                      <textarea
                        rows={4}
                        value={formDescription}
                        onChange={e => setFormDescription(e.target.value)}
                        placeholder="Describe your vehicle, features, condition, and any special notes..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeAndResetModal}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="min-w-[120px]"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {editingVehicle ? 'Updating...' : 'Adding...'}
                          </div>
                        ) : (
                          editingVehicle ? 'Update Vehicle' : 'Add Vehicle'
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}