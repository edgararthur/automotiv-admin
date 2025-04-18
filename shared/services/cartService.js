import supabase from '../supabase/supabaseClient';
import { logError } from '../utils/errorLogger';

/**
 * Service for managing shopping cart operations
 */
class CartService {
  /**
   * Add an item to the user's cart
   * @param {string} userId - The user ID
   * @param {Object} item - The item to add to cart
   * @param {string} item.product_id - The product ID
   * @param {number} item.quantity - The quantity to add
   * @param {Object} item.selected_options - Selected product options (optional)
   * @returns {Promise<Object>} - Result with success flag and cart item or error
   */
  static async addToCart(userId, item) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }
      
      if (!item.product_id || !item.quantity) {
        return { success: false, error: 'Product ID and quantity are required' };
      }
      
      // Check if the product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, price, stock_quantity, dealer_id')
        .eq('id', item.product_id)
        .single();
        
      if (productError || !product) {
        return { success: false, error: 'Product not found' };
      }
      
      // Check if there's enough stock
      if (product.stock_quantity < item.quantity) {
        return { 
          success: false, 
          error: `Only ${product.stock_quantity} units available in stock`
        };
      }
      
      // Check if the item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', item.product_id)
        .maybeSingle();
      
      let result;
      
      if (existingItem) {
        // Update existing cart item
        const newQuantity = existingItem.quantity + item.quantity;
        
        // Check again if the new quantity exceeds stock
        if (newQuantity > product.stock_quantity) {
          return { 
            success: false, 
            error: `Cannot add ${item.quantity} more units. Only ${product.stock_quantity - existingItem.quantity} more units available.`
          };
        }
        
        const { data, error } = await supabase
          .from('cart_items')
          .update({
            quantity: newQuantity,
            selected_options: item.selected_options || existingItem.selected_options,
            updated_at: new Date()
          })
          .eq('id', existingItem.id)
          .select('*, product:product_id(*)')
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Create new cart item
        const { data, error } = await supabase
          .from('cart_items')
          .insert([
            {
              user_id: userId,
              product_id: item.product_id,
              dealer_id: product.dealer_id,
              quantity: item.quantity,
              selected_options: item.selected_options || {},
              created_at: new Date(),
              updated_at: new Date()
            }
          ])
          .select('*, product:product_id(*)')
          .single();
          
        if (error) throw error;
        result = data;
      }
      
      return {
        success: true,
        cartItem: result,
        message: 'Item added to cart'
      };
    } catch (error) {
      logError('CartService.addToCart', error);
      return {
        success: false,
        error: error.message || 'Failed to add item to cart'
      };
    }
  }
  
  /**
   * Update the quantity of an item in the cart
   * @param {string} userId - The user ID
   * @param {string} cartItemId - The cart item ID
   * @param {number} quantity - The new quantity
   * @returns {Promise<Object>} - Result with success flag and updated cart item or error
   */
  static async updateCartItemQuantity(userId, cartItemId, quantity) {
    try {
      if (!userId || !cartItemId) {
        return { success: false, error: 'User ID and cart item ID are required' };
      }
      
      if (!quantity || quantity < 1) {
        return { success: false, error: 'Quantity must be at least 1' };
      }
      
      // Check if the cart item exists and belongs to the user
      const { data: cartItem, error: cartItemError } = await supabase
        .from('cart_items')
        .select('*, product:product_id(id, price, stock_quantity)')
        .eq('id', cartItemId)
        .eq('user_id', userId)
        .single();
        
      if (cartItemError || !cartItem) {
        return { success: false, error: 'Cart item not found' };
      }
      
      // Check if there's enough stock
      if (cartItem.product.stock_quantity < quantity) {
        return { 
          success: false, 
          error: `Only ${cartItem.product.stock_quantity} units available in stock` 
        };
      }
      
      // Update the cart item
      const { data, error } = await supabase
        .from('cart_items')
        .update({
          quantity,
          updated_at: new Date()
        })
        .eq('id', cartItemId)
        .select('*, product:product_id(*)')
        .single();
        
      if (error) throw error;
      
      return {
        success: true,
        cartItem: data,
        message: 'Cart item updated'
      };
    } catch (error) {
      logError('CartService.updateCartItemQuantity', error);
      return {
        success: false,
        error: error.message || 'Failed to update cart item'
      };
    }
  }
  
  /**
   * Remove an item from the cart
   * @param {string} userId - The user ID
   * @param {string} cartItemId - The cart item ID
   * @returns {Promise<Object>} - Result with success flag and message or error
   */
  static async removeFromCart(userId, cartItemId) {
    try {
      if (!userId || !cartItemId) {
        return { success: false, error: 'User ID and cart item ID are required' };
      }
      
      // Check if the cart item exists and belongs to the user
      const { data: cartItem, error: cartItemError } = await supabase
        .from('cart_items')
        .select('id')
        .eq('id', cartItemId)
        .eq('user_id', userId)
        .single();
        
      if (cartItemError || !cartItem) {
        return { success: false, error: 'Cart item not found' };
      }
      
      // Delete the cart item
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);
        
      if (error) throw error;
      
      return {
        success: true,
        message: 'Item removed from cart'
      };
    } catch (error) {
      logError('CartService.removeFromCart', error);
      return {
        success: false,
        error: error.message || 'Failed to remove item from cart'
      };
    }
  }
  
  /**
   * Get all items in a user's cart
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - Result with success flag, cart items and totals or error
   */
  static async getCartItems(userId) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }
      
      // Get all cart items with product details
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:product_id(
            id, 
            name, 
            description, 
            price, 
            sale_price, 
            stock_quantity, 
            images,
            dealer_id,
            dealer:dealer_id(id, name, logo)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Calculate cart totals
      let subtotal = 0;
      let totalItems = 0;
      
      const formattedItems = data.map(item => {
        const price = item.product.sale_price || item.product.price;
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;
        totalItems += item.quantity;
        
        return {
          id: item.id,
          product_id: item.product_id,
          product: {
            id: item.product.id,
            name: item.product.name,
            description: item.product.description,
            price: item.product.price,
            sale_price: item.product.sale_price,
            final_price: price,
            stock_quantity: item.product.stock_quantity,
            image: item.product.images && item.product.images.length > 0 
              ? item.product.images[0] 
              : null,
            dealer: item.product.dealer
          },
          quantity: item.quantity,
          selected_options: item.selected_options,
          item_total: itemTotal,
          created_at: item.created_at,
          updated_at: item.updated_at
        };
      });
      
      // Group items by dealer for shipping calculation
      const dealerGroups = {};
      formattedItems.forEach(item => {
        const dealerId = item.product.dealer.id;
        if (!dealerGroups[dealerId]) {
          dealerGroups[dealerId] = {
            dealer: item.product.dealer,
            items: [],
            subtotal: 0
          };
        }
        dealerGroups[dealerId].items.push(item);
        dealerGroups[dealerId].subtotal += item.item_total;
      });
      
      return {
        success: true,
        cart: {
          items: formattedItems,
          dealer_groups: Object.values(dealerGroups),
          subtotal,
          total_items: totalItems,
          item_count: data.length
        }
      };
    } catch (error) {
      logError('CartService.getCartItems', error);
      return {
        success: false,
        error: error.message || 'Failed to get cart items'
      };
    }
  }
  
  /**
   * Clear all items from a user's cart
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - Result with success flag and message or error
   */
  static async clearCart(userId) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return {
        success: true,
        message: 'Cart cleared successfully'
      };
    } catch (error) {
      logError('CartService.clearCart', error);
      return {
        success: false,
        error: error.message || 'Failed to clear cart'
      };
    }
  }
  
  /**
   * Update selected options for a cart item
   * @param {string} userId - The user ID
   * @param {string} cartItemId - The cart item ID
   * @param {Object} selectedOptions - The selected options
   * @returns {Promise<Object>} - Result with success flag and updated cart item or error
   */
  static async updateCartItemOptions(userId, cartItemId, selectedOptions) {
    try {
      if (!userId || !cartItemId) {
        return { success: false, error: 'User ID and cart item ID are required' };
      }
      
      // Check if the cart item exists and belongs to the user
      const { data: cartItem, error: cartItemError } = await supabase
        .from('cart_items')
        .select('id')
        .eq('id', cartItemId)
        .eq('user_id', userId)
        .single();
        
      if (cartItemError || !cartItem) {
        return { success: false, error: 'Cart item not found' };
      }
      
      // Update the cart item
      const { data, error } = await supabase
        .from('cart_items')
        .update({
          selected_options: selectedOptions,
          updated_at: new Date()
        })
        .eq('id', cartItemId)
        .select('*, product:product_id(*)')
        .single();
        
      if (error) throw error;
      
      return {
        success: true,
        cartItem: data,
        message: 'Cart item options updated'
      };
    } catch (error) {
      logError('CartService.updateCartItemOptions', error);
      return {
        success: false,
        error: error.message || 'Failed to update cart item options'
      };
    }
  }
  
  /**
   * Check if items in cart are still in stock and valid
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - Result with success flag, validation results and any issues
   */
  static async validateCart(userId) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }
      
      // Get all cart items with current product details
      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:product_id(
            id, 
            name, 
            price, 
            sale_price, 
            stock_quantity,
            active
          )
        `)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      if (cartItems.length === 0) {
        return { 
          success: true,
          is_valid: true,
          message: 'Cart is empty',
          issues: []
        };
      }
      
      const issues = [];
      let hasStockIssues = false;
      
      // Validate each item
      cartItems.forEach(item => {
        // Check if product is still active
        if (!item.product.active) {
          issues.push({
            cart_item_id: item.id,
            product_id: item.product_id,
            product_name: item.product.name,
            issue_type: 'product_unavailable',
            message: 'Product is no longer available'
          });
          hasStockIssues = true;
          return;
        }
        
        // Check if requested quantity is still in stock
        if (item.product.stock_quantity < item.quantity) {
          issues.push({
            cart_item_id: item.id,
            product_id: item.product_id,
            product_name: item.product.name,
            issue_type: 'insufficient_stock',
            requested_quantity: item.quantity,
            available_quantity: item.product.stock_quantity,
            message: `Only ${item.product.stock_quantity} units available in stock`
          });
          hasStockIssues = true;
        }
        
        // Check if product is out of stock
        if (item.product.stock_quantity === 0) {
          issues.push({
            cart_item_id: item.id,
            product_id: item.product_id,
            product_name: item.product.name,
            issue_type: 'out_of_stock',
            message: 'Product is out of stock'
          });
          hasStockIssues = true;
        }
      });
      
      return {
        success: true,
        is_valid: issues.length === 0,
        has_stock_issues: hasStockIssues,
        message: issues.length === 0 ? 'Cart is valid' : 'Cart has issues',
        issues
      };
    } catch (error) {
      logError('CartService.validateCart', error);
      return {
        success: false,
        error: error.message || 'Failed to validate cart'
      };
    }
  }
}

export default CartService; 