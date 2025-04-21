import React, { createContext, useContext, useState, useEffect } from 'react';
// Import directly from the shared directory instead of using the alias
import * as UserService from '../../shared/services/userService';
import supabase from '../../shared/supabase/supabaseClient';
import DirectUserService from '../services/DirectUserService';

// Log what was imported to check for undefined values
console.log('AuthContext imports:', { 
  UserService: !!UserService, 
  supabase: !!supabase,
  UserServiceMethods: UserService ? Object.keys(UserService) : 'undefined'
});

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('AuthProvider: initializing');
    // Get initial session
    const checkUser = async () => {
      try {
        console.log('AuthProvider: checking current user');
        
        // Try to use the direct service first for admin platform
        const directResult = await DirectUserService.getCurrentUserWithPermissions();
        
        if (directResult.success) {
          console.log('AuthProvider: user check result from DirectUserService', { 
            success: directResult.success, 
            hasUser: !!directResult.user,
            permissions: directResult.user?.profile?.permissions || []
          });
          
          setCurrentUser(directResult.user);
          setLoading(false);
          return;
        }
        
        // Fall back to shared UserService if direct service fails
        if (!UserService || !UserService.getCurrentUser) {
          console.error('AuthProvider: UserService or getCurrentUser method is undefined');
          setError('Authentication service unavailable');
          setLoading(false);
          return;
        }

        const result = await UserService.getCurrentUser();
        console.log('AuthProvider: user check result from UserService', { 
          success: result.success, 
          hasUser: !!result.user 
        });
        
        if (result.success) {
          setCurrentUser(result.user);
        } else if (result.error) {
          console.error('AuthProvider: Error fetching user:', result.error);
          setError(result.error);
        }
      } catch (err) {
        console.error('AuthProvider: Error fetching current user:', err);
        setError(err.message || 'Failed to authenticate');
      } finally {
        console.log('AuthProvider: finished initialization');
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    if (!supabase || !supabase.auth) {
      console.error('AuthProvider: supabase or supabase.auth is undefined');
      setError('Authentication service unavailable');
      setLoading(false);
      return () => {}; // Return empty cleanup function
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('AuthProvider: auth state changed', { hasSession: !!session });
        if (session) {
          try {
            // Try direct service first
            const directResult = await DirectUserService.getCurrentUserWithPermissions();
            
            if (directResult.success) {
              setCurrentUser(directResult.user);
              setLoading(false);
              return;
            }
            
            // Fall back to UserService
            const result = await UserService.getCurrentUser();
            if (result.success) {
              setCurrentUser(result.user);
            }
          } catch (err) {
            console.error('Error on auth state change:', err);
          }
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Login with email/password
  const login = async (email, password) => {
    setError('');
    try {
      const result = await UserService.loginUser(email, password);
      
      if (result.success) {
        setCurrentUser(result.user);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const message = err.message || 'Login failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Register new user
  const register = async (userData) => {
    setError('');
    try {
      const result = await UserService.registerUser(userData);
      
      if (result.success) {
        setCurrentUser(result.user);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Logout
  const logout = async () => {
    setError('');
    try {
      const result = await UserService.logoutUser();
      
      if (result.success) {
        setCurrentUser(null);
      }
      return result;
    } catch (err) {
      const message = err.message || 'Logout failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    setError('');
    try {
      const result = await UserService.resetPassword(email);
      return result;
    } catch (err) {
      const message = err.message || 'Password reset failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    setError('');
    try {
      const result = await UserService.updateProfile(currentUser.id, profileData);
      
      if (result.success) {
        setCurrentUser({
          ...currentUser,
          profile: result.profile
        });
      }
      return result;
    } catch (err) {
      const message = err.message || 'Profile update failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 