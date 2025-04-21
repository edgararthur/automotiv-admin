import supabase from '../supabase/supabaseClient';

/**
 * Service for dealer management
 */
const DealerService = {
  /**
   * Get dealer details
   * @param {string} dealerId - Dealer ID
   * @returns {Promise} - Dealer details
   */
  getDealerDetails: async (dealerId) => {
    try {
      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .eq('id', dealerId)
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        dealer: data
      };
    } catch (error) {
      console.error('Error fetching dealer details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Update dealer approval status
   * @param {string} dealerId - Dealer ID
   * @param {string} status - New approval status
   * @returns {Promise} - Result of update operation
   */
  updateDealerStatus: async (dealerId, status) => {
    try {
      const { data, error } = await supabase
        .from('dealers')
        .update({ 
          status: status,
          updated_at: new Date()
        })
        .eq('id', dealerId)
        .select();
      
      if (error) throw error;
      
      return {
        success: true,
        dealer: data[0]
      };
    } catch (error) {
      console.error('Error updating dealer status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default DealerService; 