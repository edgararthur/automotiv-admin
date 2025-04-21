import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { UserService } from '../services';

/**
 * A route wrapper component that checks for specific permissions
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 * @param {string[]} props.requiredPermissions - Array of required permissions in format 'resource.action'
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} props.redirectPath - Path to redirect to if unauthorized (default: '/unauthorized')
 * @param {React.ReactNode} props.fallback - Fallback component to render while checking permissions
 * @returns {React.ReactNode} - Protected route
 */
const PermissionProtectedRoute = ({ 
  user, 
  requiredPermissions = [], 
  children, 
  redirectPath = '/unauthorized', 
  fallback = null 
}) => {
  const [hasPermission, setHasPermission] = useState(true);
  const [isChecking, setIsChecking] = useState(requiredPermissions.length > 0);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user || !requiredPermissions.length) {
        setIsChecking(false);
        return;
      }

      try {
        // For multiple permissions, check each one
        for (const permission of requiredPermissions) {
          const [resource, action] = permission.split('.');
          if (!resource || !action) {
            console.error(`Invalid permission format: ${permission}. Should be 'resource.action'`);
            setHasPermission(false);
            setIsChecking(false);
            return;
          }

          const result = await UserService.hasPermission(user.id, resource, action);
          
          if (!result) {
            setHasPermission(false);
            setIsChecking(false);
            return;
          }
        }
        
        // If we got here, all permissions passed
        setHasPermission(true);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPermissions();
  }, [user, requiredPermissions]);

  // Show fallback while checking permissions
  if (isChecking) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-2">Checking permissions...</span>
      </div>
    );
  }

  // If user lacks required permissions, redirect
  if (!hasPermission) {
    return <Navigate to={redirectPath} replace />;
  }

  // Otherwise, render the protected content
  return children;
};

export default PermissionProtectedRoute; 