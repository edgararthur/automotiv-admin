import { createClient } from '@supabase/supabase-js';
import supabase from '../../../shared/supabase/supabaseClient.js';

// Initialize Supabase client directly as a fallback
const supabaseUrl = 'https://zlzzdycsizfwjkbulwgt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsenpkeWNzaXpmd2prYnVsd2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzI4OTQsImV4cCI6MjA2MDQ0ODg5NH0.vW5Nmy2Kh7yeI-Td41XKCdJo-n0BQxqQfGNEOcTyJRM';
const supabaseDirectClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Direct service for dealer operations to handle special cases 
 * where the shared service has issues.
 */
class DirectDealerService {
  // Simple error logger
  static logError(operation, error) {
    console.error(`DirectDealerService.${operation} error:`, error);
  }

  /**
   * Get all dealers with optional filters
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} - List of dealers
   */
  static async getDealers(options = {}) {
    try {
      let query = supabaseDirectClient
        .from('dealers')
        .select(`
          *,
          profiles:user_id(*)
        `);

      // Apply filters if provided
      if (options.status) {
        query = query.eq('verification_status', options.status);
      }

      if (options.search) {
        query = query.or(`company_name.ilike.%${options.search}%,profiles.name.ilike.%${options.search}%`);
      }

      // Apply pagination
      if (options.page && options.pageSize) {
        const from = (options.page - 1) * options.pageSize;
        const to = from + options.pageSize - 1;
        query = query.range(from, to);
      }

      // Apply sorting
      if (options.sortBy) {
        const order = options.sortOrder === 'desc' ? false : true;
        query = query.order(options.sortBy, { ascending: order });
      } else {
        // Default sorting by created_at desc
        query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query;

      if (error) {
        this.logError('getDealers', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        dealers: data,
        count: count,
      };
    } catch (error) {
      this.logError('getDealers', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get dealer details by ID
   * @param {string} dealerId - Dealer ID
   * @returns {Promise<Object>} - Dealer details
   */
  static async getDealerById(dealerId) {
    try {
      const { data: dealer, error } = await supabaseDirectClient
        .from('dealers')
        .select(`
          *,
          profiles:user_id(*)
        `)
        .eq('id', dealerId)
        .single();

      if (error) {
        this.logError('getDealerById', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        dealer
      };
    } catch (error) {
      this.logError('getDealerById', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a dealer's verification status directly through multiple methods
   * @param {string} userId - The user ID of the dealer
   * @param {string} status - The status to set (approved, rejected, pending)
   * @returns {Promise} - Result of the operation
   */
  static async updateDealerStatus(userId, status) {
    try {
      console.log('DirectDealerService attempting to update dealer status:', { userId, status });
      
      // Try shared client first
      let client = supabase;
      let clientName = 'shared client';
      
      // Get dealer record to verify it exists
      const { data: dealer, error: fetchError } = await client
        .from('dealers')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (fetchError) {
        console.error('Error fetching dealer with shared client:', fetchError);
        console.log('Falling back to direct client');
        client = supabaseDirectClient;
        clientName = 'direct client';
        
        // Try fetching with direct client
        const { data: dealerDirect, error: fetchDirectError } = await client
          .from('dealers')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (fetchDirectError) {
          console.error('Error fetching dealer with direct client:', fetchDirectError);
          throw fetchDirectError;
        }
      }
      
      console.log(`Found dealer with ${clientName}:`, dealer || dealerDirect);
      
      // Try all possible status formats since we don't know which format the DB requires
      const statusMappings = {
        'approved': ['approved', 'APPROVED', 'Approved'],
        'rejected': ['rejected', 'REJECTED', 'Rejected'],
        'pending': ['pending', 'PENDING', 'Pending'],
        'review': ['review', 'REVIEW', 'Review']
      };
      
      // Get the appropriate formats for the requested status
      const statusOptions = statusMappings[status.toLowerCase()] || [status];
      
      // Try each status value with both clients until something works
      for (const statusValue of statusOptions) {
        for (const [clientIndex, currentClient] of [client, supabaseDirectClient].entries()) {
          const currentClientName = clientIndex === 0 ? clientName : 'fallback client';
          console.log(`Trying ${currentClientName} with status: "${statusValue}"`);
          
          // Attempt the update
          const { error: updateError } = await currentClient
            .from('dealers')
            .update({ verification_status: statusValue })
            .eq('user_id', userId);
            
          if (!updateError) {
            console.log(`Success! Updated with ${currentClientName} using status: "${statusValue}"`);
            
            // Also update the user's active status in profiles table
            await this.updateUserActiveStatus(userId, status);
            
            return {
              success: true,
              message: `Dealer status updated to ${status}`
            };
          } else {
            console.error(`Failed with ${currentClientName} using status: "${statusValue}"`, updateError);
          }
        }
      }
      
      // If we get here, all attempts failed
      throw new Error('All attempts to update dealer status failed');
    } catch (error) {
      console.error('Error in DirectDealerService.updateDealerStatus:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update user profile is_active status
   * @param {string} userId - The user ID
   * @param {string} status - The dealer status
   * @returns {Promise} - Result of operation
   */
  static async updateUserActiveStatus(userId, status) {
    try {
      const isActive = status.toLowerCase() === 'approved';
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);
        
      if (error) {
        console.error('Error updating user active status:', error);
        
        // Try with direct client as fallback
        const { error: directError } = await supabaseDirectClient
          .from('profiles')
          .update({ is_active: isActive })
          .eq('id', userId);
          
        if (directError) {
          throw directError;
        }
      }
      
      return {
        success: true,
        message: `User active status updated to ${isActive}`
      };
    } catch (error) {
      console.error('Error in DirectDealerService.updateUserActiveStatus:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default DirectDealerService; 