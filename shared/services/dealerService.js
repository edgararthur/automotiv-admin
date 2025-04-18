import supabase from '../supabase/supabaseClient.js';
import { logError } from '../utils/errorLogger';

/**
 * Service for managing dealer operations, reviews, and reputation tiers
 */
class DealerService {
  /**
   * Get a dealer by ID with full details
   * @param {string} dealerId - The dealer ID
   * @returns {Promise<Object>} - Result with success flag and dealer details or error
   */
  static async getDealerById(dealerId) {
    try {
      if (!dealerId) {
        return { success: false, error: 'Dealer ID is required' };
      }
      
      const { data: dealer, error } = await supabase
        .from('dealers')
        .select(`
          *,
          user:user_id(id, name, email, profile_image),
          reviews(
            id,
            rating,
            comment,
            created_at,
            reviewer:user_id(id, name, profile_image)
          )
        `)
        .eq('id', dealerId)
        .single();
        
      if (error) throw error;
      
      if (!dealer) {
        return { success: false, error: 'Dealer not found' };
      }

      // Calculate average rating
      const avgRating = dealer.reviews.length > 0 
        ? dealer.reviews.reduce((sum, review) => sum + review.rating, 0) / dealer.reviews.length 
        : 0;
      
      // Determine reputation tier based on average rating and number of reviews
      const reputationTier = this.calculateReputationTier(avgRating, dealer.reviews.length);
      
      return {
        success: true,
        dealer: {
          ...dealer,
          average_rating: parseFloat(avgRating.toFixed(1)),
          review_count: dealer.reviews.length,
          reputation_tier: reputationTier
        }
      };
    } catch (error) {
      logError('DealerService.getDealerById', error);
      return {
        success: false,
        error: error.message || 'Failed to get dealer details'
      };
    }
  }
  
  /**
   * Get dealers with filter options
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of dealers to return
   * @param {number} options.offset - Offset for pagination
   * @param {string} options.search - Search term for dealer name
   * @param {string} options.minimum_tier - Minimum reputation tier (silver, gold, diamond)
   * @param {number} options.minimum_rating - Minimum average rating
   * @param {string} options.location - Filter by location
   * @returns {Promise<Object>} - Result with success flag and dealers or error
   */
  static async getDealers(options = {}) {
    try {
      let query = supabase
        .from('dealers')
        .select(`
          *,
          user:user_id(id, name, email, profile_image),
          reviews!dealer_id(id, rating)
        `);
      
      // Apply filters
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%, company_name.ilike.%${options.search}%`);
      }
      
      if (options.location) {
        query = query.ilike('location', `%${options.location}%`);
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      // Execute query
      const { data: dealers, error, count } = await query;
      
      if (error) throw error;
      
      // Post-process dealers to add average rating and tier
      const processedDealers = dealers.map(dealer => {
        const reviews = dealer.reviews || [];
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
          : 0;
        
        const reputationTier = this.calculateReputationTier(avgRating, reviews.length);
        
        return {
          ...dealer,
          reviews: undefined, // Remove raw reviews data
          average_rating: parseFloat(avgRating.toFixed(1)),
          review_count: reviews.length,
          reputation_tier: reputationTier
        };
      });
      
      // Apply post-query filters that require computed fields
      let filteredDealers = processedDealers;
      
      if (options.minimum_rating) {
        filteredDealers = filteredDealers.filter(
          dealer => dealer.average_rating >= options.minimum_rating
        );
      }
      
      if (options.minimum_tier) {
        const tierValues = { 'bronze': 1, 'silver': 2, 'gold': 3, 'diamond': 4 };
        const minTierValue = tierValues[options.minimum_tier.toLowerCase()] || 0;
        
        filteredDealers = filteredDealers.filter(dealer => {
          const dealerTierValue = tierValues[dealer.reputation_tier.toLowerCase()] || 0;
          return dealerTierValue >= minTierValue;
        });
      }
      
      return {
        success: true,
        dealers: filteredDealers,
        count: filteredDealers.length,
        total: count
      };
    } catch (error) {
      logError('DealerService.getDealers', error);
      return {
        success: false,
        error: error.message || 'Failed to get dealers'
      };
    }
  }
  
  /**
   * Add a review for a dealer
   * @param {string} dealerId - The dealer ID
   * @param {string} userId - The reviewer user ID
   * @param {Object} reviewData - The review data
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment
   * @returns {Promise<Object>} - Result with success flag and review or error
   */
  static async addDealerReview(dealerId, userId, reviewData) {
    try {
      if (!dealerId || !userId) {
        return { success: false, error: 'Dealer ID and user ID are required' };
      }
      
      if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
        return { success: false, error: 'Valid rating (1-5) is required' };
      }
      
      // Check if the user has already reviewed this dealer
      const { data: existingReview, error: checkError } = await supabase
        .from('dealer_reviews')
        .select('id')
        .eq('dealer_id', dealerId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      let reviewResult;
      
      if (existingReview) {
        // Update existing review
        const { data, error } = await supabase
          .from('dealer_reviews')
          .update({
            rating: reviewData.rating,
            comment: reviewData.comment || null,
            updated_at: new Date()
          })
          .eq('id', existingReview.id)
          .select('*, user:user_id(name, profile_image)')
          .single();
          
        if (error) throw error;
        reviewResult = data;
      } else {
        // Create new review
        const { data, error } = await supabase
          .from('dealer_reviews')
          .insert([
            {
              dealer_id: dealerId,
              user_id: userId,
              rating: reviewData.rating,
              comment: reviewData.comment || null,
              created_at: new Date(),
              updated_at: new Date()
            }
          ])
          .select('*, user:user_id(name, profile_image)')
          .single();
          
        if (error) throw error;
        reviewResult = data;
      }
      
      // Update dealer's average rating
      await this.updateDealerRatingSummary(dealerId);
      
      return {
        success: true,
        review: reviewResult,
        message: existingReview ? 'Review updated successfully' : 'Review added successfully'
      };
    } catch (error) {
      logError('DealerService.addDealerReview', error);
      return {
        success: false,
        error: error.message || 'Failed to add review'
      };
    }
  }
  
  /**
   * Get all reviews for a dealer
   * @param {string} dealerId - The dealer ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of reviews to return
   * @param {number} options.offset - Offset for pagination
   * @param {string} options.sort_by - Sort field (created_at, rating)
   * @param {string} options.sort_order - Sort order (asc, desc)
   * @returns {Promise<Object>} - Result with success flag and reviews or error
   */
  static async getDealerReviews(dealerId, options = {}) {
    try {
      if (!dealerId) {
        return { success: false, error: 'Dealer ID is required' };
      }
      
      let query = supabase
        .from('dealer_reviews')
        .select(`
          *,
          user:user_id(id, name, profile_image)
        `)
        .eq('dealer_id', dealerId);
      
      // Apply sorting
      const sortField = options.sort_by || 'created_at';
      const sortOrder = options.sort_order === 'asc' ? true : false;
      query = query.order(sortField, { ascending: sortOrder });
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data: reviews, error, count } = await query;
      
      if (error) throw error;
      
      // Get total count of reviews
      const { count: totalCount, error: countError } = await supabase
        .from('dealer_reviews')
        .select('id', { count: 'exact' })
        .eq('dealer_id', dealerId);
        
      if (countError) throw countError;
      
      return {
        success: true,
        reviews,
        count: reviews.length,
        total: totalCount
      };
    } catch (error) {
      logError('DealerService.getDealerReviews', error);
      return {
        success: false,
        error: error.message || 'Failed to get dealer reviews'
      };
    }
  }
  
  /**
   * Calculate the reputation tier for a dealer
   * @param {number} averageRating - Dealer's average rating
   * @param {number} reviewCount - Number of reviews
   * @returns {string} - Reputation tier (bronze, silver, gold, diamond)
   */
  static calculateReputationTier(averageRating, reviewCount) {
    // Baseline is bronze
    if (reviewCount < 5 || averageRating < 3) {
      return 'bronze';
    }
    
    // Silver: At least 5 reviews and 3.0+ rating
    if ((reviewCount >= 5 && averageRating >= 3 && averageRating < 4) || 
        (reviewCount < 15 && averageRating >= 4)) {
      return 'silver';
    }
    
    // Gold: 15+ reviews and 4.0+ rating, or 30+ reviews and 3.5+ rating
    if ((reviewCount >= 15 && averageRating >= 4 && averageRating < 4.5) || 
        (reviewCount >= 30 && averageRating >= 3.5 && averageRating < 4.5) ||
        (reviewCount < 30 && averageRating >= 4.5)) {
      return 'gold';
    }
    
    // Diamond: 30+ reviews and 4.5+ rating
    if (reviewCount >= 30 && averageRating >= 4.5) {
      return 'diamond';
    }
    
    // Fallback
    return 'bronze';
  }
  
  /**
   * Update the dealer's rating summary in the database
   * @param {string} dealerId - The dealer ID
   * @returns {Promise<void>}
   */
  static async updateDealerRatingSummary(dealerId) {
    try {
      // Calculate the average rating from all reviews
      const { data: reviews, error } = await supabase
        .from('dealer_reviews')
        .select('rating')
        .eq('dealer_id', dealerId);
        
      if (error) throw error;
      
      if (!reviews || reviews.length === 0) {
        return;
      }
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      const reputationTier = this.calculateReputationTier(averageRating, reviews.length);
      
      // Update the dealer record with the new average rating and reputation tier
      await supabase
        .from('dealers')
        .update({
          average_rating: parseFloat(averageRating.toFixed(1)),
          review_count: reviews.length,
          reputation_tier: reputationTier,
          updated_at: new Date()
        })
        .eq('id', dealerId);
        
    } catch (error) {
      logError('DealerService.updateDealerRatingSummary', error);
      throw error;
    }
  }
}

export default DealerService; 