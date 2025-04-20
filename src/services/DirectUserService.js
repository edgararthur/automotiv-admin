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
        .select(`
          *,
          users!user_id(id, email, created_at, last_sign_in_at)
        `);
      
      // Apply filters
      if (options.role) {
        query = query.eq('role', options.role);
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
}

export default DirectUserService; 