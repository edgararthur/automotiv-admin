import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly
const supabaseUrl = 'https://zlzzdycsizfwjkbulwgt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsenpkeWNzaXpmd2prYnVsd2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzI4OTQsImV4cCI6MjA2MDQ0ODg5NH0.vW5Nmy2Kh7yeI-Td41XKCdJo-n0BQxqQfGNEOcTyJRM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simple error logger
const logError = (source, error) => {
  console.error(`[ERROR] ${source}:`, error);
};

/**
 * Direct implementation of UserService to avoid import issues
 */
class DirectUserService {
  /**
   * Get all users with optional filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Result with success flag and users or error
   */
  static async getAllUsers(options = {}) {
    try {
      let query = supabase
        .from('profiles')
        .select('*');
      
      // Apply filters
      if (options.role) {
        query = query.eq('user_type', options.role);
      }
      
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%, email.ilike.%${options.search}%`);
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      // Execute query
      const { data: users, error, count } = await query;
      
      if (error) throw error;
      
      return {
        success: true,
        users,
        count: users.length,
        total: count
      };
    } catch (error) {
      logError('DirectUserService.getAllUsers', error);
      return {
        success: false,
        error: error.message || 'Failed to get users'
      };
    }
  }

  /**
   * Update a user's status
   * @param {string} userId - The user ID
   * @param {string} status - The new status
   * @returns {Promise<Object>} - Result with success flag and message or error
   */
  static async updateUserStatus(userId, status) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }
      
      if (!status) {
        return { success: false, error: 'Status is required' };
      }
      
      // Update user profile status
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status,
          updated_at: new Date()
        })
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return {
        success: true,
        message: `User status updated to "${status}"`
      };
    } catch (error) {
      logError('DirectUserService.updateUserStatus', error);
      return {
        success: false,
        error: error.message || 'Failed to update user status'
      };
    }
  }

  /**
   * Get current user with permissions
   * @returns {Promise<Object>} - Result with success flag and user data or error
   */
  static async getCurrentUserWithPermissions() {
    try {
      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!sessionData.session) {
        return {
          success: false,
          message: 'No active session'
        };
      }
      
      const userId = sessionData.session.user.id;
      
      // Get user profile without trying to join with roles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      // For ADMIN users, hardcode permissions
      const isAdmin = profile.user_type === 'admin';
      
      // Define standard admin permissions
      const adminPermissions = [
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'products.view', 'products.create', 'products.edit', 'products.delete', 'products.moderate',
        'dealers.view', 'dealers.create', 'dealers.edit', 'dealers.approve',
        'roles.view', 'roles.manage',
        'analytics.view',
        'support.view'
      ];
      
      console.log('User profile data:', {
        user_type: profile.user_type,
        isAdmin: isAdmin,
        permissions: isAdmin ? adminPermissions : []
      });
      
      return {
        success: true,
        user: {
          ...sessionData.session.user,
          profile: {
            ...profile,
            role: isAdmin ? 'ADMIN' : profile.user_type?.toUpperCase() || 'UNKNOWN',
            // Add permissions based on user type
            permissions: isAdmin ? adminPermissions : [],
            // Add a roles object for compatibility
            roles: { 
              name: isAdmin ? 'ADMIN' : profile.user_type?.toUpperCase() || 'UNKNOWN'
            }
          }
        }
      };
    } catch (error) {
      logError('DirectUserService.getCurrentUserWithPermissions', error);
      return {
        success: false,
        error: error.message || 'Failed to get current user'
      };
    }
  }
}

export default DirectUserService; 