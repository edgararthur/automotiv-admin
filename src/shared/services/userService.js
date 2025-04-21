import supabase from '../supabase/supabaseClient';

/**
 * Service for user authentication and profile management
 */
const UserService = {
  /**
   * Get currently authenticated user
   * @returns {Promise<Object>} Object with success flag and user data if available
   */
  getCurrentUser: async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return { success: false, error: sessionError?.message || 'No active session' };
      }
      
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (userError) {
        console.error('Error fetching user profile:', userError);
        return { 
          success: true, 
          user: {
            ...session.user,
            profile: null
          }
        };
      }
      
      return { 
        success: true, 
        user: {
          ...session.user,
          profile: user
        }
      };
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Login user with email and password
   * @param {string} email User email
   * @param {string} password User password
   * @returns {Promise<Object>} Object with success flag and user data if successful
   */
  loginUser: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Logout current user
   * @returns {Promise<Object>} Object with success flag
   */
  logoutUser: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Register a new user
   * @param {Object} userData User registration data
   * @returns {Promise<Object>} Object with success flag and user data if successful
   */
  registerUser: async (userData) => {
    try {
      const { email, password, ...profileData } = userData;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: profileData.name,
            role: profileData.role || 'buyer'
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send password reset email
   * @param {string} email User email
   * @returns {Promise<Object>} Object with success flag
   */
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        throw error;
      }
      
      return { 
        success: true,
        message: 'Password reset instructions sent to your email'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update user profile
   * @param {string} userId User ID
   * @param {Object} profileData Updated profile data
   * @returns {Promise<Object>} Object with success flag and updated profile
   */
  updateProfile: async (userId, profileData) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { success: true, profile: data };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  }
};

export default UserService; 