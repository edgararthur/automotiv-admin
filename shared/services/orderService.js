import supabase from '../supabase/supabaseClient';
import { logError } from '../utils/errorLogger';
import CartService from './cartService';
import PaymentService from './paymentService';

/**
 * Service for managing order operations
 */
class OrderService {
  /**
   * Create a new order from cart items
   * @param {string} userId - The user ID
   * @param {Object} orderData - Order information
   * @param {Object} orderData.shipping_address - Shipping address details
   * @param {string} orderData.payment_method_id - ID of the payment method to use
   * @param {string} orderData.shipping_method - Selected shipping method
   * @param {Object} orderData.order_notes - Optional notes for the order
   * @returns {Promise<Object>} - Result with success flag and order data or error
   */
  static async createOrder(userId, orderData) {
    try {
      // Validate inputs
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }
      
      if (!orderData.shipping_address || !orderData.payment_method_id || !orderData.shipping_method) {
        return { 
          success: false, 
          error: 'Shipping address, payment method and shipping method are required' 
        };
      }
      
      // Validate the cart first
      const { success: validationSuccess, is_valid, issues } = await CartService.validateCart(userId);
      
      if (!validationSuccess) {
        return { success: false, error: 'Failed to validate cart' };
      }
      
      if (!is_valid) {
        return { 
          success: false, 
          error: 'Cannot create order with invalid cart', 
          issues 
        };
      }
      
      // Get cart items
      const { success: cartSuccess, cart } = await CartService.getCartItems(userId);
      
      if (!cartSuccess || !cart) {
        return { success: false, error: 'Failed to retrieve cart items' };
      }
      
      if (cart.items.length === 0) {
        return { success: false, error: 'Cannot create order with empty cart' };
      }
      
      // Start a Supabase transaction
      // Create the order using a stored procedure
      const { data: order, error } = await supabase
        .rpc('create_order_from_cart', {
          p_user_id: userId,
          p_shipping_address: orderData.shipping_address,
          p_payment_method_id: orderData.payment_method_id,
          p_shipping_method: orderData.shipping_method,
          p_order_notes: orderData.order_notes || {}
        });
      
      if (error) throw error;
      
      if (!order || !order.id) {
        return { success: false, error: 'Failed to create order' };
      }
      
      // Clear the cart after successful order creation
      await CartService.clearCart(userId);
      
      // Process payment
      if (orderData.process_payment) {
        const { success: paymentSuccess, error: paymentError } = await PaymentService.processPayment(
          order.id,
          order.total_amount,
          orderData.payment_method_id
        );
        
        if (!paymentSuccess) {
          return {
            success: false,
            error: paymentError || 'Failed to process payment',
            order_id: order.id
          };
        }
      }
      
      // Format and return the order data
      const formattedOrder = await this.formatOrderData(order);
      
      return {
        success: true,
        order: formattedOrder,
        message: 'Order created successfully'
      };
    } catch (error) {
      logError('OrderService.createOrder', error);
      return {
        success: false,
        error: error.message || 'Failed to create order'
      };
    }
  }
  
  /**
   * Get order details by ID
   * @param {string} orderId - The order ID
   * @param {string} userId - The user ID (for authorization)
   * @returns {Promise<Object>} - Result with success flag and order data or error
   */
  static async getOrderById(orderId, userId) {
    try {
      if (!orderId) {
        return { success: false, error: 'Order ID is required' };
      }
      
      // Fetch the order with its items
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:product_id(
              id, 
              name, 
              description, 
              images,
              dealer_id,
              dealer:dealer_id(id, name, logo)
            )
          ),
          user:user_id(id, email, first_name, last_name),
          shipping_address:shipping_address_id(*)
        `)
        .eq('id', orderId)
        .single();
      
      if (error) throw error;
      
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      
      // If userId is provided, ensure the user has access to this order
      if (userId && order.user_id !== userId) {
        // Check if user is a dealer with access to this order
        const { data: dealerCheck } = await supabase
          .from('dealers')
          .select('id')
          .eq('user_id', userId)
          .single();
          
        const hasDealerAccess = order.order_items.some(item => 
          item.product.dealer_id === dealerCheck?.id
        );
        
        if (!hasDealerAccess) {
          return { success: false, error: 'Unauthorized access to order' };
        }
      }
      
      // Format and return the order data
      const formattedOrder = await this.formatOrderData(order);
      
      return {
        success: true,
        order: formattedOrder
      };
    } catch (error) {
      logError('OrderService.getOrderById', error);
      return {
        success: false,
        error: error.message || 'Failed to get order details'
      };
    }
  }
  
  /**
   * Get all orders for a user
   * @param {string} userId - The user ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of orders to return
   * @param {number} options.offset - Offset for pagination
   * @param {string} options.status - Filter by order status
   * @returns {Promise<Object>} - Result with success flag and orders data or error
   */
  static async getUserOrders(userId, options = {}) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }
      
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
            product:product_id(id, images)
          ),
          shipping_address:shipping_address_id(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data: orders, error } = await query;
      
      if (error) throw error;
      
      // Count total orders for pagination
      const { count, error: countError } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq(options.status ? 'status' : 'id', options.status || undefined);
        
      if (countError) throw countError;
      
      // Format order data
      const formattedOrders = orders.map(order => {
        // Get the first product image from the first order item
        const firstItem = order.order_items[0];
        const thumbnail = firstItem && firstItem.product && firstItem.product.images 
          ? firstItem.product.images[0] 
          : null;
          
        return {
          id: order.id,
          order_number: order.order_number,
          total_amount: order.total_amount,
          status: order.status,
          payment_status: order.payment_status,
          shipping_status: order.shipping_status,
          tracking_number: order.tracking_number,
          shipping_method: order.shipping_method,
          shipping_address: order.shipping_address,
          created_at: order.created_at,
          updated_at: order.updated_at,
          items_count: order.order_items.length,
          items: order.order_items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
            thumbnail: item.product && item.product.images ? item.product.images[0] : null
          })),
          thumbnail
        };
      });
      
      return {
        success: true,
        orders: formattedOrders,
        total: count,
        limit: options.limit || 10,
        offset: options.offset || 0
      };
    } catch (error) {
      logError('OrderService.getUserOrders', error);
      return {
        success: false,
        error: error.message || 'Failed to get user orders'
      };
    }
  }
  
  /**
   * Cancel an order
   * @param {string} orderId - The order ID
   * @param {string} userId - The user ID (for authorization)
   * @param {string} reason - Reason for cancellation
   * @returns {Promise<Object>} - Result with success flag and message or error
   */
  static async cancelOrder(orderId, userId, reason = '') {
    try {
      if (!orderId || !userId) {
        return { success: false, error: 'Order ID and user ID are required' };
      }
      
      // Check if order exists and belongs to the user
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, status, payment_status')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();
        
      if (error) {
        return { success: false, error: 'Order not found' };
      }
      
      // Check if order can be canceled
      const cancelableStatuses = ['pending', 'confirmed'];
      if (!cancelableStatuses.includes(order.status)) {
        return { 
          success: false, 
          error: `Cannot cancel order with status "${order.status}". Only orders with status "pending" or "confirmed" can be canceled.`
        };
      }
      
      // Update order status
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'canceled',
          cancellation_reason: reason,
          updated_at: new Date()
        })
        .eq('id', orderId)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      // If order was paid, create a refund
      if (order.payment_status === 'paid') {
        // Initialize refund process
        await supabase
          .from('order_events')
          .insert([
            {
              order_id: orderId,
              user_id: userId,
              event_type: 'refund_initiated',
              event_data: {
                reason: reason || 'Order canceled by customer',
                amount: updatedOrder.total_amount
              }
            }
          ]);
      }
      
      return {
        success: true,
        message: 'Order canceled successfully'
      };
    } catch (error) {
      logError('OrderService.cancelOrder', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel order'
      };
    }
  }
  
  /**
   * Get orders for a dealer
   * @param {string} dealerId - The dealer ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of orders to return
   * @param {number} options.offset - Offset for pagination
   * @param {string} options.status - Filter by order status
   * @returns {Promise<Object>} - Result with success flag and orders data or error
   */
  static async getDealerOrders(dealerId, options = {}) {
    try {
      if (!dealerId) {
        return { success: false, error: 'Dealer ID is required' };
      }
      
      // First get order items for this dealer
      let query = supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          order:order_id(
            id,
            order_number,
            status,
            payment_status,
            shipping_status,
            total_amount,
            shipping_method,
            created_at,
            updated_at,
            user:user_id(id, email, first_name, last_name),
            shipping_address:shipping_address_id(*)
          ),
          product_id,
          product_name,
          quantity,
          unit_price
        `)
        .eq('dealer_id', dealerId);
        
      // Apply filters
      if (options.status) {
        query = query.eq('order.status', options.status);
      }
      
      // Apply pagination for the orders query
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data: orderItems, error } = await query;
      
      if (error) throw error;
      
      // Count total orders for pagination
      const { count, error: countError } = await supabase
        .from('order_items')
        .select('order_id', { count: 'exact', distinct: true })
        .eq('dealer_id', dealerId);
        
      if (countError) throw countError;
      
      // Group items by order
      const orderMap = {};
      orderItems.forEach(item => {
        if (!orderMap[item.order_id]) {
          orderMap[item.order_id] = {
            id: item.order.id,
            order_number: item.order.order_number,
            status: item.order.status,
            payment_status: item.order.payment_status,
            shipping_status: item.order.shipping_status,
            total_amount: item.order.total_amount,
            shipping_method: item.order.shipping_method,
            created_at: item.order.created_at,
            updated_at: item.order.updated_at,
            customer: {
              id: item.order.user.id,
              email: item.order.user.email,
              name: `${item.order.user.first_name} ${item.order.user.last_name}`
            },
            shipping_address: item.order.shipping_address,
            items: []
          };
        }
        
        orderMap[item.order_id].items.push({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price
        });
      });
      
      // Calculate dealer subtotal for each order
      Object.values(orderMap).forEach(order => {
        order.dealer_subtotal = order.items.reduce(
          (sum, item) => sum + item.total_price, 
          0
        );
      });
      
      return {
        success: true,
        orders: Object.values(orderMap),
        total: count,
        limit: options.limit || 10,
        offset: options.offset || 0
      };
    } catch (error) {
      logError('OrderService.getDealerOrders', error);
      return {
        success: false,
        error: error.message || 'Failed to get dealer orders'
      };
    }
  }
  
  /**
   * Update shipping status of an order
   * @param {string} orderId - The order ID
   * @param {string} dealerId - The dealer ID for authorization
   * @param {string} newStatus - The new shipping status
   * @param {string} trackingNumber - Optional tracking number
   * @returns {Promise<Object>} - Result with success flag and message or error
   */
  static async updateShippingStatus(orderId, dealerId, newStatus, trackingNumber = null) {
    try {
      if (!orderId || !dealerId || !newStatus) {
        return { 
          success: false, 
          error: 'Order ID, dealer ID and new status are required' 
        };
      }
      
      // Valid shipping statuses
      const validStatuses = [
        'pending', 
        'processing', 
        'shipped', 
        'delivered', 
        'cancelled'
      ];
      
      if (!validStatuses.includes(newStatus)) {
        return { 
          success: false, 
          error: `Invalid shipping status. Must be one of: ${validStatuses.join(', ')}` 
        };
      }
      
      // Check if dealer has items in this order
      const { count, error: countError } = await supabase
        .from('order_items')
        .select('id', { count: 'exact' })
        .eq('order_id', orderId)
        .eq('dealer_id', dealerId);
        
      if (countError) throw countError;
      
      if (count === 0) {
        return { 
          success: false, 
          error: 'Dealer does not have items in this order' 
        };
      }
      
      // Get current order status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('status, shipping_status')
        .eq('id', orderId)
        .single();
        
      if (orderError) throw orderError;
      
      // Check if order status allows shipping status update
      if (order.status === 'canceled') {
        return { 
          success: false, 
          error: 'Cannot update shipping status for a canceled order' 
        };
      }
      
      // Update shipping status
      const updateData = {
        shipping_status: newStatus,
        updated_at: new Date()
      };
      
      // Add tracking number if provided
      if (trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }
      
      // Update order status to 'shipped' if shipping status is 'shipped'
      if (newStatus === 'shipped' && order.status === 'confirmed') {
        updateData.status = 'shipped';
      }
      
      // Update order status to 'delivered' if shipping status is 'delivered'
      if (newStatus === 'delivered') {
        updateData.status = 'delivered';
      }
      
      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
        
      if (updateError) throw updateError;
      
      // Log the shipping status update
      await supabase
        .from('order_events')
        .insert([
          {
            order_id: orderId,
            user_id: null,
            dealer_id: dealerId,
            event_type: 'shipping_status_updated',
            event_data: {
              previous_status: order.shipping_status,
              new_status: newStatus,
              tracking_number: trackingNumber
            }
          }
        ]);
      
      return {
        success: true,
        message: `Shipping status updated to "${newStatus}"`
      };
    } catch (error) {
      logError('OrderService.updateShippingStatus', error);
      return {
        success: false,
        error: error.message || 'Failed to update shipping status'
      };
    }
  }
  
  /**
   * Helper method to format order data
   * @param {Object} order - The order data
   * @returns {Promise<Object>} - Formatted order data
   */
  static async formatOrderData(order) {
    try {
      // Group items by dealer
      const dealerGroups = {};
      
      if (order.order_items) {
        order.order_items.forEach(item => {
          const dealerId = item.product?.dealer?.id || 'unknown';
          
          if (!dealerGroups[dealerId]) {
            dealerGroups[dealerId] = {
              dealer: item.product?.dealer || { id: dealerId, name: 'Unknown Dealer' },
              items: [],
              subtotal: 0
            };
          }
          
          const formattedItem = {
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name || item.product?.name,
            product: item.product,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
            selected_options: item.selected_options || {}
          };
          
          dealerGroups[dealerId].items.push(formattedItem);
          dealerGroups[dealerId].subtotal += formattedItem.total_price;
        });
      }
      
      // Get payment details if available
      let paymentDetails = null;
      if (order.id) {
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (payments && payments.length > 0) {
          paymentDetails = payments[0];
        }
      }
      
      return {
        id: order.id,
        order_number: order.order_number,
        user: order.user,
        status: order.status,
        payment_status: order.payment_status,
        shipping_status: order.shipping_status,
        shipping_method: order.shipping_method,
        shipping_address: order.shipping_address,
        tracking_number: order.tracking_number,
        subtotal: order.subtotal,
        shipping_fee: order.shipping_fee,
        tax: order.tax,
        total_amount: order.total_amount,
        payment: paymentDetails,
        order_notes: order.order_notes,
        created_at: order.created_at,
        updated_at: order.updated_at,
        dealer_groups: Object.values(dealerGroups),
        items: order.order_items
      };
    } catch (error) {
      logError('OrderService.formatOrderData', error);
      return order;
    }
  }
}

export default OrderService; 