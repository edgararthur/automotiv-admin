import supabase from '../supabase/supabaseClient';
import { logError } from '../utils/errorLogger';

// Get environment variables
const MTN_MOMO_API_KEY = import.meta.env.VITE_MTN_MOMO_API_KEY;
const MTN_MOMO_USER_ID = import.meta.env.VITE_MTN_MOMO_USER_ID;
const MTN_MOMO_API_URL = import.meta.env.VITE_MTN_MOMO_API_URL;

const TELECEL_CASH_API_KEY = import.meta.env.VITE_TELECEL_CASH_API_KEY;
const TELECEL_CASH_MERCHANT_ID = import.meta.env.VITE_TELECEL_CASH_MERCHANT_ID;
const TELECEL_CASH_API_URL = import.meta.env.VITE_TELECEL_CASH_API_URL;

// Fixed service charge amount
const SERVICE_CHARGE = 5.00; // 5 GHS

// This would be an environment variable in production
const STRIPE_API_KEY = 'sk_test_mockkey';

// Set processing fee percentage and fixed amount
const PROCESSING_FEE_PERCENTAGE = 0.029; // 2.9%
const PROCESSING_FEE_FIXED = 0.30; // $0.30

/**
 * Service for managing payment operations and payment methods
 */
class PaymentService {
  /**
   * Create a new payment method for a user
   * @param {Object} paymentMethodData - The payment method data
   * @param {string} paymentMethodData.user_id - The user ID
   * @param {string} paymentMethodData.type - The payment method type (e.g., 'momo', 'telecel')
   * @param {string} paymentMethodData.provider - The payment provider (e.g., 'momo', 'telecel')
   * @param {string} paymentMethodData.mobile_number - The mobile number for mobile money
   * @param {boolean} paymentMethodData.is_default - Whether this is the default payment method
   * @returns {Promise<Object>} - Result with success flag and payment method or error
   */
  static async createPaymentMethod(paymentMethodData) {
    try {
      if (!paymentMethodData.user_id) {
        return { success: false, error: 'User ID is required' };
      }
      
      if (!paymentMethodData.type || !paymentMethodData.provider || !paymentMethodData.mobile_number) {
        return { success: false, error: 'Payment method details are incomplete' };
      }
      
      // If setting as default, unset existing default payment methods
      if (paymentMethodData.is_default) {
        await supabase
          .from('payment_methods')
          .update({ is_default: false })
          .eq('user_id', paymentMethodData.user_id);
      }
      
      // Check if a payment method with the same mobile number already exists
      const { data: existingMethod } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', paymentMethodData.user_id)
        .eq('mobile_number', paymentMethodData.mobile_number)
        .eq('provider', paymentMethodData.provider)
        .single();
        
      // If it exists, update it instead of creating a new one
      if (existingMethod) {
        const { data, error } = await supabase
          .from('payment_methods')
          .update({
            is_default: paymentMethodData.is_default,
            updated_at: new Date()
          })
          .eq('id', existingMethod.id)
          .select()
          .single();
          
        if (error) throw error;
        
        return { 
          success: true, 
          paymentMethod: data,
          message: 'Payment method updated successfully'
        };
      }
      
      // Create a new payment method
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([
          {
            user_id: paymentMethodData.user_id,
            type: paymentMethodData.type,
            provider: paymentMethodData.provider,
            mobile_number: paymentMethodData.mobile_number,
            is_default: paymentMethodData.is_default,
            created_at: new Date(),
            updated_at: new Date()
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      return { 
        success: true, 
        paymentMethod: data,
        message: 'Payment method created successfully'
      };
    } catch (error) {
      logError('PaymentService.createPaymentMethod', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment method'
      };
    }
  }
  
  /**
   * Get all payment methods for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - Result with success flag and payment methods or error
   */
  static async getUserPaymentMethods(userId) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }
      
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return { 
        success: true, 
        paymentMethods: data
      };
    } catch (error) {
      logError('PaymentService.getUserPaymentMethods', error);
      return {
        success: false,
        error: error.message || 'Failed to get payment methods'
      };
    }
  }
  
  /**
   * Process a payment for an order
   * @param {string} orderId - The order ID
   * @param {number} amount - The payment amount
   * @param {string} paymentMethodId - The payment method ID
   * @returns {Promise<Object>} - Result with success flag and payment or error
   */
  static async processPayment(orderId, amount, paymentMethodId) {
    try {
      if (!orderId) {
        return { success: false, error: 'Order ID is required' };
      }
      
      if (!amount || amount <= 0) {
        return { success: false, error: 'Valid payment amount is required' };
      }
      
      if (!paymentMethodId) {
        return { success: false, error: 'Payment method ID is required' };
      }
      
      // Get the payment method
      const { data: paymentMethod, error: methodError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', paymentMethodId)
        .single();
        
      if (methodError) throw new Error('Payment method not found');
      
      // Create payment record (initially pending)
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            order_id: orderId,
            payment_method_id: paymentMethodId,
            amount,
            status: 'pending',
            created_at: new Date(),
            updated_at: new Date()
          }
        ])
        .select()
        .single();
        
      if (paymentError) throw paymentError;
      
      // Here you would normally integrate with a real payment gateway
      // For example, MTN Mobile Money API, Telecel Cash API, etc.
      // For demonstration, we'll simulate a successful payment
      
      // Update payment status to 'succeeded' after processing
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          transaction_id: `TXN-${Date.now()}`,
          updated_at: new Date()
        })
        .eq('id', payment.id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      // Also update the order status to 'paid'
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          updated_at: new Date()
        })
        .eq('id', orderId);
      
      return { 
        success: true, 
        payment: updatedPayment,
        message: 'Payment processed successfully'
      };
    } catch (error) {
      logError('PaymentService.processPayment', error);
      
      // If payment was created but failed during processing, mark it as failed
      if (error.paymentId) {
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date()
          })
          .eq('id', error.paymentId);
      }
      
      return {
        success: false,
        error: error.message || 'Payment processing failed'
      };
    }
  }
  
  /**
   * Get payment details by ID
   * @param {string} paymentId - The payment ID
   * @returns {Promise<Object>} - Result with success flag and payment or error
   */
  static async getPaymentById(paymentId) {
    try {
      if (!paymentId) {
        return { success: false, error: 'Payment ID is required' };
      }
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          payment_method:payment_method_id(*)
        `)
        .eq('id', paymentId)
        .single();
        
      if (error) throw error;
      
      return { 
        success: true, 
        payment: data
      };
    } catch (error) {
      logError('PaymentService.getPaymentById', error);
      return {
        success: false,
        error: error.message || 'Failed to get payment details'
      };
    }
  }
  
  /**
   * Get payments for an order
   * @param {string} orderId - The order ID
   * @returns {Promise<Object>} - Result with success flag and payments or error
   */
  static async getOrderPayments(orderId) {
    try {
      if (!orderId) {
        return { success: false, error: 'Order ID is required' };
      }
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          payment_method:payment_method_id(*)
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return { 
        success: true, 
        payments: data
      };
    } catch (error) {
      logError('PaymentService.getOrderPayments', error);
      return {
        success: false,
        error: error.message || 'Failed to get order payments'
      };
    }
  }
}

export default PaymentService; 