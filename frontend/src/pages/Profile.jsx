import { useState, useEffect } from 'react';
import { Camera, Mail, Phone, MapPin, Edit2, Save, X, User as UserIcon, Star, AlertTriangle, Loader2, Calendar, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import RatingStars from '../components/RatingStars';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Profile() {
  const { token, logout } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  // State for data
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalBookings: 0, memberSince: 'N/A', vehicleCount: 0, avgRating: 0 });
  
  // State for UI control
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State for forms
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', bio: '', location: '' });

  const fetchData = async () => {
    if (!token) {
      setIsLoading(false);
      setError("Authentication required.");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const [profileRes, vehiclesRes, bookingsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/vehicles/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/bookings/my`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!profileRes.ok || !vehiclesRes.ok || !bookingsRes.ok) {
        throw new Error('Could not fetch all profile data. Please try again.');
      }

      const profileData = await profileRes.json();
      const vehiclesData = await vehiclesRes.json();
      const bookingsData = await bookingsRes.json();
      
      setProfile(profileData);
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        bio: profileData.bio || 'Passionate about sharing great vehicles with the community.',
        location: profileData.location || 'Bangalore, Karnataka'
      });

      const totalBookings = bookingsData.length;
      const vehicleCount = vehiclesData.length;
      const memberSince = profileData.createdAt ? format(new Date(profileData.createdAt), 'MMMM yyyy') : 'N/A';
      const avgRating = vehicleCount > 0 
        ? (vehiclesData.reduce((acc, v) => acc + (v.ratings || 0), 0) / vehicleCount)
        : 0;

      setStats({ totalBookings, memberSince, vehicleCount, avgRating });

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);
  
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to update profile.');
      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      addNotification('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || 'Passionate about sharing great vehicles with the community.',
        location: profile.location || 'Bangalore, Karnataka'
    });
    setIsEditing(false);
  };

  const handleAvatarChange = (e) => {
    // Implementation of handleAvatarChange function
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <Button onClick={fetchData}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Profile</h2>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} icon={<Edit2 className="h-4 w-4" />}>Edit</Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCancel} icon={<X className="h-4 w-4" />}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} icon={isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
                <div className="relative flex-shrink-0">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img src={profile?.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=random`} alt={profile?.name} className="w-24 h-24 rounded-full object-cover" />
                      <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-gray-700 text-white p-2 rounded-full cursor-pointer hover:bg-gray-800">
                        <Camera size={16} />
                        <input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarChange} />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center sm:text-left">{profile?.name}</h3>
                  <div className="flex items-center justify-center sm:justify-start mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mr-1" />{formData.location || 'Location not set'}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mt-2">
                    <RatingStars rating={stats.avgRating} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">({stats.totalBookings} reviews)</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Input label="Full Name" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={!isEditing} />
                <Input label="Email Address" name="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled />
                <Input label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={!isEditing} />
                <Input label="Location" name="location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} disabled={!isEditing} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                  <textarea name="bio" rows={4} value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" placeholder="Tell us about yourself..." />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Statistics</h2>
              <div className="space-y-4">
                <StatItem label="Overall Rating" value={stats.avgRating.toFixed(1)} />
                <StatItem label="Total Bookings" value={stats.totalBookings} />
                <StatItem label="Vehicles Hosted" value={stats.vehicleCount} />
                <StatItem label="Member Since" value={stats.memberSince} />
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h2>
              <div className="space-y-3">
                 <Button as={Link} to="/bookings" variant="outline" className="w-full justify-start" icon={<Calendar className="h-5 w-5 mr-2" />}>My Bookings</Button>
                 <Button as={Link} to="/my-vehicles" variant="outline" className="w-full justify-start" icon={<Car className="h-5 w-5 mr-2" />}>My Vehicles</Button>
                 <Button variant="destructive-outline" onClick={() => navigate('/logout')} className="w-full justify-start">Log Out</Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatItem = ({ label, value }) => (
  <div className="flex justify-between items-baseline">
    <span className="text-gray-600 dark:text-gray-400">{label}</span>
    <span className="font-bold text-lg text-gray-900 dark:text-white">{value}</span>
  </div>
);