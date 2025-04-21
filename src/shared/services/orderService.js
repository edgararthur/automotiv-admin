import supabase from '../supabase/supabaseClient';

/**
 * Service for order management
 */
const OrderService = {
  /**
   * Get orders with optional filters
   * @param {Object} filters - Filters for orders (status, date range, etc.)
   * @returns {Promise} - Result with orders
   */
  getOrders: async (filters = {}) => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          buyer:buyer_id(id, name, email),
          order_items(
            id,
            product_id,
            quantity,
            price,
            products:product_id(name, image_url)
          )
        `);
      
      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status.toUpperCase());
      }
      
      if (filters.dealerId) {
        query = query.eq('dealer_id', filters.dealerId);
      }
      
      if (filters.buyerId) {
        query = query.eq('buyer_id', filters.buyerId);
      }
      
      // Sort by created date descending by default
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        orders: data || []
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status (PROCESSING, SHIPPED, DELIVERED, etc.)
   * @returns {Promise} - Result of the update operation
   */
  updateOrderStatus: async (orderId, status) => {
    try {
      // Validate status
      const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      const normalizedStatus = status.toUpperCase();
      
      if (!validStatuses.includes(normalizedStatus)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: normalizedStatus,
          updated_at: new Date()
        })
        .eq('id', orderId)
        .select();
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        order: data[0]
      };
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default OrderService; 