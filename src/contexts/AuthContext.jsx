import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserService, supabase } from 'autoplus-shared';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get initial session
    const checkUser = async () => {
      try {
        const result = await UserService.getCurrentUser();
        if (result.success) {
          setCurrentUser(result.user);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          try {
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