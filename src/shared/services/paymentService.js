import supabase from '../supabase/supabaseClient';

/**
 * Service for payment processing
 */
const PaymentService = {
  /**
   * Get payment details
   * @param {string} paymentId - Payment ID
   * @returns {Promise} - Payment details
   */
  getPaymentDetails: async (paymentId) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        payment: data
      };
    } catch (error) {
      console.error('Error fetching payment details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default PaymentService; 