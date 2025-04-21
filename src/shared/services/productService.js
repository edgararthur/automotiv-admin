import supabase from '../supabase/supabaseClient';

/**
 * Service for managing products in the marketplace
 */
const ProductService = {
  /**
   * Get all products with optional filters
   * @param {Object} filters - Optional filters for products
   * @returns {Promise} - Products
   */
  getProducts: async (filters = {}) => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          dealer:dealer_id(id, name, company_name, location),
          category:category_id(id, name),
          subcategory:subcategory_id(id, name),
          product_images(id, url)
        `);

      // Apply filters if provided
      if (filters.dealerId) {
        query = query.eq('dealer_id', filters.dealerId);
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.subcategoryId) {
        query = query.eq('subcategory_id', filters.subcategoryId);
      }

      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }

      if (filters.minPrice && filters.maxPrice) {
        query = query.gte('price', filters.minPrice).lte('price', filters.maxPrice);
      } else if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      } else if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%,part_number.ilike.%${filters.searchTerm}%`);
      }

      // Apply sorting
      if (filters.sortBy) {
        const order = filters.sortOrder === 'desc' ? 'desc' : 'asc';
        query = query.order(filters.sortBy, { ascending: order === 'asc' });
      } else {
        // Default sort by created_at (newest first)
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        products: data || [],
        count
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Update a product's status
   * @param {string} productId - The ID of the product to update
   * @param {string} status - The new status (approved, rejected, etc.)
   * @returns {Promise} - Result of the operation
   */
  updateProductStatus: async (productId, status) => {
    try {
      // Map status strings to database values if needed
      const statusMapping = {
        'approved': 'approved',
        'rejected': 'rejected',
        'pending': 'pending'
      };

      const mappedStatus = statusMapping[status.toLowerCase()] || status;
      
      const { data, error } = await supabase
        .from('products')
        .update({ 
          approval_status: mappedStatus,
          status: mappedStatus === 'approved' ? 'active' : 'inactive',
          updated_at: new Date()
        })
        .eq('id', productId)
        .select();

      if (error) {
        throw error;
      }

      return {
        success: true,
        product: data[0]
      };
    } catch (error) {
      console.error('Error updating product status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default ProductService; 