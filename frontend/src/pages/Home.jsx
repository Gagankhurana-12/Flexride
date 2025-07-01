import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Car, Users, Zap, Shield, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import VehicleCard from '../components/VehicleCard';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const features = [
  {
    icon: <Shield className="h-8 w-8" />,
    title: 'Secure & Safe',
    description: 'All vehicles are verified and insured for your safety and peace of mind.'
  },
  {
    icon: <Clock className="h-8 w-8" />,
    title: '24/7 Support',
    description: 'Round-the-clock customer support to help you with any queries or issues.'
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: 'Instant Booking',
    description: 'Book vehicles instantly with our streamlined booking process.'
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Community Driven',
    description: 'Connect with local vehicle owners and build trust within your community.'
  }
];

const stats = [
  { number: '10,000+', label: 'Happy Customers' },
  { number: '5,000+', label: 'Vehicles Listed' },
  { number: '50+', label: 'Cities Covered' },
  { number: '4.8', label: 'Average Rating' }
];

export default function Home() {
  const [featuredVehicles, setFeaturedVehicles] = React.useState([]);
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  React.useEffect(() => {
    fetch(`${BACKEND_URL}/api/vehicles`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Take the first 3 vehicles as featured
          setFeaturedVehicles(data.slice(0, 3));
        }
      })
      .catch(err => console.error("Failed to fetch vehicles:", err));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Rent. Drive. Explore.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto"
            >
              Discover the freedom of community-based vehicle rental. Find the perfect ride from trusted local owners.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/vehicles">
              <Button size="lg" variant="outline" className="border-white text-blue-600 bg-white hover:bg-blue-50 hover:text-blue-700 min-w-[200px]">

                  Browse Vehicles
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link to="/my-vehicles">
                <Button size="lg" variant="outline" className="border-white text-blue-600 bg-white hover:bg-blue-50 hover:text-blue-700 min-w-[200px]">
                  List Your Vehicle
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Vehicles
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover our most popular and highly-rated vehicles from trusted community members.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredVehicles.map((vehicle, index) => (
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

          <div className="text-center mt-12">
            <Link to="/vehicles">
              <Button size="lg" variant="outline">
                View All Vehicles
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose FlexRide?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Experience the future of community-based vehicle sharing with our trusted platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform duration-200">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-100">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Join thousands of satisfied customers who trust FlexRide for their transportation needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="min-w-[200px]"
              onClick={() => {
                if (user) {
                  addNotification('You are already logged in.', 'warning');
                } else {
                  navigate('/register');
                }
              }}
            >
              Sign Up Now
            </Button>
            <Link to="/vehicles">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                Browse Vehicles
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}