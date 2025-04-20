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
 * Direct implementation of OrderService to avoid import issues
 */
class DirectOrderService {
  /**
   * Get orders with filter options
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Result with success flag and orders or error
   */
  static async getOrders(options = {}) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            dealer_id
          ),
          user:user_id(id, email, name)
        `);
      
      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      if (options.payment_status) {
        query = query.eq('payment_status', options.payment_status);
      }
      
      if (options.user_id) {
        query = query.eq('user_id', options.user_id);
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      // Execute query
      const { data: orders, error, count } = await query;
      
      if (error) throw error;
      
      return {
        success: true,
        orders,
        count: orders.length,
        total: count
      };
    } catch (error) {
      logError('DirectOrderService.getOrders', error);
      return {
        success: false,
        error: error.message || 'Failed to get orders'
      };
    }
  }
}

export default DirectOrderService; 