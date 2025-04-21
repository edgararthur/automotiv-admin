import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../common/LoadingScreen';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, error } = useAuth();
  
  // Get user role from either roles object or user_type
  const userRole = currentUser?.profile?.roles?.name || 
                   currentUser?.profile?.user_type?.toUpperCase() || 
                   currentUser?.profile?.role;

  console.log('ProtectedRoute:', { 
    isLoading: loading, 
    hasUser: !!currentUser, 
    hasError: !!error,
    userRole: userRole
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
        <div className="text-neutral-600 font-medium">Loading authentication...</div>
      </div>
    );
  }

  // Show authentication errors
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-600 text-xl mb-4">Authentication Error</div>
        <div className="text-gray-600 mb-6">{error}</div>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => window.location.href = '/login'}
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (!currentUser) {
    console.log('ProtectedRoute: No authenticated user, redirecting to login');
    return <Navigate to="/login" />;
  }

  // Check if user has admin role (check multiple possible locations)
  const isAdmin = 
    userRole === 'ADMIN' || 
    userRole === 'SUPER_ADMIN' || 
    currentUser?.profile?.user_type?.toLowerCase() === 'admin';
  
  if (!isAdmin) {
    console.log('ProtectedRoute: User is not an admin, redirecting to unauthorized');
    return <Navigate to="/unauthorized" />;
  }

  console.log('ProtectedRoute: Authentication successful, rendering content');
  return children;
};

export default ProtectedRoute; 