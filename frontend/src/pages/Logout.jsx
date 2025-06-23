import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Logout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (!hasLoggedOut.current && user) {
      logout();
      hasLoggedOut.current = true;
    }
    navigate('/', { replace: true });
  }, [user, logout, navigate]);

  return null;
} 