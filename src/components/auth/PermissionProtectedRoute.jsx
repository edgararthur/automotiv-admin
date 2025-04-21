import React from 'react';
import { Navigate } from 'react-router-dom';

const PermissionProtectedRoute = ({ user, requiredPermissions = [], children }) => {
  // Check if user exists
  if (!user) {
    console.log('PermissionProtectedRoute: User not authenticated');
    return <Navigate to="/login" />;
  }

  // Get user's permissions from profile
  const userPermissions = user.profile?.permissions || [];
  
  // Check if user has ADMIN role (special case) - admins have all permissions
  // Try all possible locations where the role might be defined
  const userRole = user.profile?.roles?.name || user.profile?.role || user.profile?.user_type?.toUpperCase();
  const isAdmin = userRole === 'ADMIN' || 
                  userRole === 'SUPER_ADMIN' || 
                  user.profile?.user_type?.toLowerCase() === 'admin';
  
  // Log the user info for debugging
  console.log('PermissionProtectedRoute: ', {
    isLoading: false,
    hasUser: !!user,
    hasError: false,
    userRole,
    isAdmin,
    userProfile: user.profile,
    userPermissions,
    requiredPermissions
  });

  // Check if user has the specific permissions or is an admin
  const hasPermission = isAdmin || requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );

  if (!hasPermission) {
    console.log('PermissionProtectedRoute: User lacks required permissions', {
      required: requiredPermissions,
      userHas: userPermissions,
      userRole
    });
    return <Navigate to="/unauthorized" />;
  }

  console.log('PermissionProtectedRoute: Authentication successful, rendering content');
  // User has the required permissions
  return children;
};

export default PermissionProtectedRoute; 