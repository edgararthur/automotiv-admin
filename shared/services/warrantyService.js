import supabase from '../supabase/supabaseClient.js';
import { logError } from '../utils/errorLogger.js';

/**
 * Service for managing product warranties and warranty claims
 */
class WarrantyService {
  /**
   * Get all warranty policies for a dealer
   * @param {string} dealerId - The dealer ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of warranties to return
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Object>} - Result with success flag and warranties or error
   */
  static async getDealerWarranties(dealerId, options = {}) {
    try {
      if (!dealerId) {
        return { success: false, error: 'Dealer ID is required' };
      }
      
      let query = supabase
        .from('warranty_policies')
        .select('*')
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: false });
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data: warranties, error, count } = await query;
      
      if (error) throw error;
      
      // Get applied count for each warranty
      const { data: appliedCounts, error: countError } = await supabase
        .from('products')
        .select('warranty_policy_id, count')
        .eq('dealer_id', dealerId)
        .group('warranty_policy_id');
      
      if (countError) throw countError;
      
      // Combine warranty data with applied counts
      const processedWarranties = warranties.map(warranty => {
        const appliedCount = appliedCounts.find(
          count => count.warranty_policy_id === warranty.id
        );
        
        return {
          ...warranty,
          applied_products: appliedCount ? parseInt(appliedCount.count) : 0
        };
      });
      
      return {
        success: true,
        warranties: processedWarranties,
        count: processedWarranties.length,
        total: count
      };
    } catch (error) {
      logError('WarrantyService.getDealerWarranties', error);
      return {
        success: false,
        error: error.message || 'Failed to get warranty policies'
      };
    }
  }
  
  /**
   * Get a warranty policy by ID
   * @param {string} policyId - The warranty policy ID
   * @returns {Promise<Object>} - Result with success flag and warranty details or error
   */
  static async getWarrantyById(policyId) {
    try {
      if (!policyId) {
        return { success: false, error: 'Warranty policy ID is required' };
      }
      
      const { data: warranty, error } = await supabase
        .from('warranty_policies')
        .select('*')
        .eq('id', policyId)
        .single();
        
      if (error) throw error;
      
      if (!warranty) {
        return { success: false, error: 'Warranty policy not found' };
      }
      
      return {
        success: true,
        warranty
      };
    } catch (error) {
      logError('WarrantyService.getWarrantyById', error);
      return {
        success: false,
        error: error.message || 'Failed to get warranty policy details'
      };
    }
  }
  
  /**
   * Create a new warranty policy
   * @param {string} dealerId - The dealer ID
   * @param {Object} warrantyData - The warranty policy data
   * @param {string} warrantyData.title - Policy title
   * @param {string} warrantyData.description - Short description
   * @param {number} warrantyData.duration - Duration value
   * @param {string} warrantyData.duration_type - Duration type (days, months, years)
   * @param {string} warrantyData.coverage_details - Full coverage details
   * @param {boolean} warrantyData.is_default - Whether this is the default policy
   * @returns {Promise<Object>} - Result with success flag and created warranty or error
   */
  static async createWarrantyPolicy(dealerId, warrantyData) {
    try {
      if (!dealerId) {
        return { success: false, error: 'Dealer ID is required' };
      }
      
      if (!warrantyData.title || !warrantyData.description || !warrantyData.duration) {
        return { success: false, error: 'Title, description and duration are required' };
      }
      
      // If this is being set as default, unset existing default
      if (warrantyData.is_default) {
        const { error: updateError } = await supabase
          .from('warranty_policies')
          .update({ is_default: false })
          .eq('dealer_id', dealerId)
          .eq('is_default', true);
          
        if (updateError) throw updateError;
      }
      
      // Create the new policy
      const { data: warranty, error } = await supabase
        .from('warranty_policies')
        .insert({
          dealer_id: dealerId,
          title: warrantyData.title,
          description: warrantyData.description,
          duration: warrantyData.duration,
          duration_type: warrantyData.duration_type || 'days',
          coverage_details: warrantyData.coverage_details || '',
          is_default: warrantyData.is_default || false
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        warranty
      };
    } catch (error) {
      logError('WarrantyService.createWarrantyPolicy', error);
      return {
        success: false,
        error: error.message || 'Failed to create warranty policy'
      };
    }
  }
  
  /**
   * Update an existing warranty policy
   * @param {string} policyId - The warranty policy ID
   * @param {string} dealerId - The dealer ID
   * @param {Object} warrantyData - The updated warranty policy data
   * @returns {Promise<Object>} - Result with success flag and updated warranty or error
   */
  static async updateWarrantyPolicy(policyId, dealerId, warrantyData) {
    try {
      if (!policyId || !dealerId) {
        return { success: false, error: 'Policy ID and dealer ID are required' };
      }
      
      // If this is being set as default, unset existing default
      if (warrantyData.is_default) {
        const { error: updateError } = await supabase
          .from('warranty_policies')
          .update({ is_default: false })
          .eq('dealer_id', dealerId)
          .eq('is_default', true)
          .neq('id', policyId);
          
        if (updateError) throw updateError;
      }
      
      // Update the policy
      const { data: warranty, error } = await supabase
        .from('warranty_policies')
        .update({
          title: warrantyData.title,
          description: warrantyData.description,
          duration: warrantyData.duration,
          duration_type: warrantyData.duration_type,
          coverage_details: warrantyData.coverage_details,
          is_default: warrantyData.is_default
        })
        .eq('id', policyId)
        .eq('dealer_id', dealerId) // Security check
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        warranty
      };
    } catch (error) {
      logError('WarrantyService.updateWarrantyPolicy', error);
      return {
        success: false,
        error: error.message || 'Failed to update warranty policy'
      };
    }
  }
  
  /**
   * Delete a warranty policy
   * @param {string} policyId - The warranty policy ID
   * @param {string} dealerId - The dealer ID
   * @returns {Promise<Object>} - Result with success flag or error
   */
  static async deleteWarrantyPolicy(policyId, dealerId) {
    try {
      if (!policyId || !dealerId) {
        return { success: false, error: 'Policy ID and dealer ID are required' };
      }
      
      // Check if this is the default policy
      const { data: policy, error: checkError } = await supabase
        .from('warranty_policies')
        .select('is_default')
        .eq('id', policyId)
        .eq('dealer_id', dealerId)
        .single();
      
      if (checkError) throw checkError;
      
      if (!policy) {
        return { success: false, error: 'Warranty policy not found' };
      }
      
      if (policy.is_default) {
        return { success: false, error: 'Cannot delete the default warranty policy. Please set another policy as default first.' };
      }
      
      // Find default warranty to assign to products with this warranty
      const { data: defaultPolicy, error: defaultError } = await supabase
        .from('warranty_policies')
        .select('id')
        .eq('dealer_id', dealerId)
        .eq('is_default', true)
        .single();
      
      if (defaultError && !defaultError.message.includes('No rows found')) throw defaultError;
      
      const defaultPolicyId = defaultPolicy ? defaultPolicy.id : null;
      
      // Update products using this warranty to use the default warranty
      if (defaultPolicyId) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ warranty_policy_id: defaultPolicyId })
          .eq('warranty_policy_id', policyId)
          .eq('dealer_id', dealerId);
        
        if (updateError) throw updateError;
      }
      
      // Delete the policy
      const { error: deleteError } = await supabase
        .from('warranty_policies')
        .delete()
        .eq('id', policyId)
        .eq('dealer_id', dealerId);
      
      if (deleteError) throw deleteError;
      
      return {
        success: true
      };
    } catch (error) {
      logError('WarrantyService.deleteWarrantyPolicy', error);
      return {
        success: false,
        error: error.message || 'Failed to delete warranty policy'
      };
    }
  }
  
  /**
   * Submit a warranty claim
   * @param {string} orderId - The order ID
   * @param {string} productId - The product ID
   * @param {string} userId - The user submitting the claim
   * @param {Object} claimData - The claim data
   * @returns {Promise<Object>} - Result with success flag and claim details or error
   */
  static async submitWarrantyClaim(orderId, productId, userId, claimData) {
    try {
      if (!orderId || !productId || !userId) {
        return { success: false, error: 'Order ID, product ID and user ID are required' };
      }
      
      if (!claimData.reason || !claimData.description) {
        return { success: false, error: 'Claim reason and description are required' };
      }
      
      // Create the claim
      const { data: claim, error } = await supabase
        .from('warranty_claims')
        .insert({
          order_id: orderId,
          product_id: productId,
          user_id: userId,
          reason: claimData.reason,
          description: claimData.description,
          status: 'pending',
          images: claimData.images || []
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        claim
      };
    } catch (error) {
      logError('WarrantyService.submitWarrantyClaim', error);
      return {
        success: false,
        error: error.message || 'Failed to submit warranty claim'
      };
    }
  }
  
  /**
   * Get warranty claims for a dealer
   * @param {string} dealerId - The dealer ID
   * @param {Object} options - Query options
   * @param {string} options.status - Filter by status (pending, approved, rejected)
   * @param {number} options.limit - Maximum number of claims to return
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Object>} - Result with success flag and claims or error
   */
  static async getDealerWarrantyClaims(dealerId, options = {}) {
    try {
      if (!dealerId) {
        return { success: false, error: 'Dealer ID is required' };
      }
      
      let query = supabase
        .from('warranty_claims')
        .select(`
          *,
          product:product_id(id, name, sku, dealer_id),
          order:order_id(id, order_number),
          user:user_id(id, name, email, profile_image)
        `)
        .eq('product.dealer_id', dealerId)
        .order('created_at', { ascending: false });
      
      // Apply status filter
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
      
      const { data: claims, error, count } = await query;
      
      if (error) throw error;
      
      return {
        success: true,
        claims,
        count: claims.length,
        total: count
      };
    } catch (error) {
      logError('WarrantyService.getDealerWarrantyClaims', error);
      return {
        success: false,
        error: error.message || 'Failed to get warranty claims'
      };
    }
  }
  
  /**
   * Update warranty claim status
   * @param {string} claimId - The claim ID to update
   * @param {string} status - The new status (approved, rejected)
   * @param {string} dealerId - The dealer ID for authorization
   * @param {Object} options - Additional options
   * @param {string} options.notes - Notes about the decision
   * @returns {Promise<Object>} - Result with success flag or error
   */
  static async updateClaimStatus(claimId, status, dealerId, options = {}) {
    try {
      if (!claimId || !status || !dealerId) {
        return { success: false, error: 'Claim ID, status and dealer ID are required' };
      }
      
      if (!['approved', 'rejected'].includes(status)) {
        return { success: false, error: 'Status must be approved or rejected' };
      }
      
      // First verify that this dealer owns the product
      const { data: claim, error: fetchError } = await supabase
        .from('warranty_claims')
        .select(`
          id,
          product:product_id(id, dealer_id)
        `)
        .eq('id', claimId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (!claim) {
        return { success: false, error: 'Warranty claim not found' };
      }
      
      // Verify dealer owns the product
      if (claim.product?.dealer_id !== dealerId) {
        return { success: false, error: 'Unauthorized to update this claim' };
      }
      
      // Update the claim status
      const updateData = {
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: dealerId
      };
      
      if (options.notes) {
        updateData.dealer_notes = options.notes;
      }
      
      const { error: updateError } = await supabase
        .from('warranty_claims')
        .update(updateData)
        .eq('id', claimId);
      
      if (updateError) throw updateError;
      
      // If approved, create a return authorization (this would be handled by another service)
      if (status === 'approved') {
        // Logic to generate return authorization would go here
        // This might involve another API call or service
      }
      
      return {
        success: true
      };
    } catch (error) {
      logError('WarrantyService.updateClaimStatus', error);
      return {
        success: false,
        error: error.message || 'Failed to update warranty claim status'
      };
    }
  }
}

export default WarrantyService; 