import supabase from '../supabase/supabaseClient.js';

/**
 * Service for user authentication and management
 */
const UserService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - Registration result
   */
  registerUser: async (userData) => {
    try {
      // Validate required fields
      if (!userData.email || !userData.password || !userData.name || !userData.phone) {
        throw new Error('Missing required user information');
      }

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
            role: userData.role || 'BUYER' // Default role is BUYER
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // Add additional user data to profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role || 'BUYER',
          created_at: new Date(),
          profile_image: userData.profile_image || null,
          location: userData.location || null,
          company_name: userData.company_name || null,
          is_active: true
        });

      if (profileError) {
        throw profileError;
      }

      // If registering as a dealer, add dealer-specific info
      if (userData.role === 'DEALER' && userData.company_name) {
        const { error: dealerError } = await supabase
          .from('dealers')
          .insert({
            user_id: authData.user.id,
            company_name: userData.company_name,
            location: userData.location || null,
            verification_status: 'PENDING',
            created_at: new Date()
          });

        if (dealerError) {
          throw dealerError;
        }
      }

      return {
        success: true,
        user: authData.user,
        message: 'User registered successfully'
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Login result
   */
  loginUser: async (email, password) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      return {
        success: true,
        user: {
          ...data.user,
          profile: profileData
        },
        session: data.session
      };
    } catch (error) {
      console.error('Error logging in:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Logout the current user
   * @returns {Promise} - Logout result
   */
  logoutUser: async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Error logging out:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get the current user session
   * @returns {Promise} - User session
   */
  getCurrentUser: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (!data.session) {
        return {
          success: false,
          message: 'No active session'
        };
      }

      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      return {
        success: true,
        user: {
          ...data.session.user,
          profile: profileData
        },
        session: data.session
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} - Update result
   */
  updateProfile: async (userId, profileData) => {
    try {
      // Add updated_at timestamp
      profileData.updated_at = new Date();

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select();

      if (error) {
        throw error;
      }

      // If updating dealer-specific info
      if (profileData.role === 'DEALER' && profileData.company_name) {
        const dealerData = {
          company_name: profileData.company_name,
          location: profileData.location || null,
          updated_at: new Date()
        };

        const { error: dealerError } = await supabase
          .from('dealers')
          .update(dealerData)
          .eq('user_id', userId);

        if (dealerError) {
          throw dealerError;
        }
      }

      return {
        success: true,
        profile: data[0],
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Reset password
   * @param {string} email - User email
   * @returns {Promise} - Reset password result
   */
  resetPassword: async (email) => {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Password reset email sent'
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Update password
   * @param {string} newPassword - New password
   * @returns {Promise} - Update password result
   */
  updatePassword: async (newPassword) => {
    try {
      if (!newPassword) {
        throw new Error('New password is required');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      console.error('Error updating password:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default UserService; 