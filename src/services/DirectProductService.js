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
 * Direct implementation of ProductService to avoid import issues
 */
class DirectProductService {
  /**
   * Get products with filter options
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Result with success flag and products or error
   */
  static async getProducts(options = {}) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          dealer:dealer_id(id, company_name),
          categories(id, name)
        `);
      
      // Apply filters
      if (options.approval_status) {
        query = query.eq('approval_status', options.approval_status);
      }
      
      if (options.category_id) {
        query = query.eq('category_id', options.category_id);
      }
      
      if (options.dealer_id) {
        query = query.eq('dealer_id', options.dealer_id);
      }
      
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%, description.ilike.%${options.search}%`);
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      // Execute query
      const { data: products, error, count } = await query;
      
      if (error) throw error;
      
      return {
        success: true,
        products,
        count: products.length,
        total: count
      };
    } catch (error) {
      logError('DirectProductService.getProducts', error);
      return {
        success: false,
        error: error.message || 'Failed to get products'
      };
    }
  }
}

export default DirectProductService; 