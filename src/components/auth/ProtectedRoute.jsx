import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../common/LoadingScreen';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Check if user has admin role
  if (currentUser?.profile?.role !== 'ADMIN') {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute; 