import supabase from '../supabase/supabaseClient.js';
import { logError } from '../utils/errorLogger.js';

/**
 * Service for fetching platform analytics data
 */
class AnalyticsService {
  /**
   * Get platform analytics dashboard data
   * @param {Object} options - Query options
   * @param {string} options.timeRange - Time range to fetch data for (month, quarter, year)
   * @param {string} options.startDate - Start date in ISO format
   * @param {string} options.endDate - End date in ISO format
   * @returns {Promise<Object>} - Result with success flag and analytics data or error
   */
  static async getPlatformAnalytics(options = {}) {
    try {
      const { timeRange = 'year', startDate, endDate } = options;
      const now = new Date();
      
      // Calculate default date range if not provided
      const start = startDate ? new Date(startDate) : this.getStartDateFromTimeRange(timeRange);
      const end = endDate ? new Date(endDate) : now;
      
      // Fetch total revenue and orders
      const { data: revenueData, error: revenueError } = await supabase
        .rpc('get_platform_revenue', {
          start_date: start.toISOString(),
          end_date: end.toISOString()
        });
      
      if (revenueError) throw revenueError;
      
      // Fetch active users
      const { data: userData, error: userError } = await supabase
        .rpc('get_active_users', {
          start_date: start.toISOString(),
          end_date: end.toISOString()
        });
      
      if (userError) throw userError;
      
      // Fetch monthly revenue data
      const { data: monthlyData, error: monthlyError } = await supabase
        .rpc('get_monthly_revenue', {
          start_date: start.toISOString(),
          end_date: end.toISOString()
        });
      
      if (monthlyError) throw monthlyError;
      
      // Fetch top products
      const { data: topProducts, error: productError } = await supabase
        .rpc('get_top_products', {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          limit_count: 5
        });
      
      if (productError) throw productError;
      
      // Fetch category distribution
      const { data: categoryData, error: categoryError } = await supabase
        .rpc('get_category_distribution', {
          start_date: start.toISOString(),
          end_date: end.toISOString()
        });
      
      if (categoryError) throw categoryError;
      
      // Fetch traffic sources
      const { data: trafficData, error: trafficError } = await supabase
        .rpc('get_traffic_sources', {
          start_date: start.toISOString(),
          end_date: end.toISOString()
        });
      
      if (trafficError) throw trafficError;
      
      // Fetch device distribution
      const { data: deviceData, error: deviceError } = await supabase
        .rpc('get_device_distribution', {
          start_date: start.toISOString(),
          end_date: end.toISOString()
        });
      
      if (deviceError) throw deviceError;
      
      // Fetch geographic distribution
      const { data: geoData, error: geoError } = await supabase
        .rpc('get_geographic_distribution', {
          start_date: start.toISOString(),
          end_date: end.toISOString()
        });
      
      if (geoError) throw geoError;
      
      // Calculate metrics
      const totalRevenue = revenueData.total_revenue || 0;
      const previousRevenue = revenueData.previous_period_revenue || 0;
      const revenueChange = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;
      
      const salesCount = revenueData.order_count || 0;
      const previousSalesCount = revenueData.previous_period_order_count || 0;
      const salesChange = previousSalesCount > 0 
        ? ((salesCount - previousSalesCount) / previousSalesCount) * 100 
        : 0;
      
      const activeUsers = userData.active_users || 0;
      const previousActiveUsers = userData.previous_period_active_users || 0;
      const userChange = previousActiveUsers > 0 
        ? ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100 
        : 0;
      
      const averageOrderValue = salesCount > 0 ? totalRevenue / salesCount : 0;
      const previousAOV = previousSalesCount > 0 ? previousRevenue / previousSalesCount : 0;
      const aovChange = previousAOV > 0 
        ? ((averageOrderValue - previousAOV) / previousAOV) * 100 
        : 0;
      
      const conversionRate = userData.conversion_rate || 0;
      const previousConversionRate = userData.previous_period_conversion_rate || 0;
      const conversionChange = previousConversionRate > 0 
        ? ((conversionRate - previousConversionRate) / previousConversionRate) * 100 
        : 0;
      
      // Format the results
      const result = {
        totalRevenue: {
          value: totalRevenue,
          change: parseFloat(revenueChange.toFixed(1)),
          isPositive: revenueChange >= 0
        },
        salesCount: {
          value: salesCount,
          change: parseFloat(salesChange.toFixed(1)),
          isPositive: salesChange >= 0
        },
        activeUsers: {
          value: activeUsers,
          change: parseFloat(userChange.toFixed(1)),
          isPositive: userChange >= 0
        },
        averageOrderValue: {
          value: averageOrderValue,
          change: parseFloat(aovChange.toFixed(1)),
          isPositive: aovChange >= 0
        },
        conversionRate: {
          value: parseFloat(conversionRate.toFixed(2)),
          change: parseFloat(conversionChange.toFixed(1)),
          isPositive: conversionChange >= 0
        },
        monthlyRevenue: monthlyData.map(item => ({
          month: this.getMonthAbbreviation(item.month),
          value: item.revenue
        })),
        categories: categoryData.map(item => ({
          name: item.category_name,
          value: parseFloat(item.percentage.toFixed(1))
        })),
        topProducts: topProducts.map(item => ({
          name: item.product_name,
          sales: item.units_sold,
          revenue: item.total_revenue
        })),
        trafficSources: trafficData.map(item => ({
          source: item.source,
          users: item.users,
          percentage: parseFloat(item.percentage.toFixed(1))
        })),
        userDevices: deviceData.map(item => ({
          device: item.device_type,
          percentage: parseFloat(item.percentage.toFixed(1))
        })),
        geographicData: geoData.map(item => ({
          region: item.region,
          sales: item.sales,
          percentage: parseFloat(item.percentage.toFixed(1))
        }))
      };
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      logError('AnalyticsService.getPlatformAnalytics', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch analytics data'
      };
    }
  }
  
  /**
   * Get dealer-specific analytics
   * @param {string} dealerId - Dealer ID
   * @param {Object} options - Query options
   * @param {string} options.timeRange - Time range to fetch data for (month, quarter, year)
   * @param {string} options.startDate - Start date in ISO format
   * @param {string} options.endDate - End date in ISO format
   * @returns {Promise<Object>} - Result with success flag and analytics data or error
   */
  static async getDealerAnalytics(dealerId, options = {}) {
    try {
      if (!dealerId) {
        return { success: false, error: 'Dealer ID is required' };
      }
      
      const { timeRange = 'year', startDate, endDate } = options;
      const now = new Date();
      
      // Calculate default date range if not provided
      const start = startDate ? new Date(startDate) : this.getStartDateFromTimeRange(timeRange);
      const end = endDate ? new Date(endDate) : now;
      
      // Fetch dealer revenue data
      const { data: revenueData, error: revenueError } = await supabase
        .rpc('get_dealer_revenue', {
          p_dealer_id: dealerId,
          start_date: start.toISOString(),
          end_date: end.toISOString()
        });
      
      if (revenueError) throw revenueError;
      
      // Fetch dealer monthly revenue
      const { data: monthlyData, error: monthlyError } = await supabase
        .rpc('get_dealer_monthly_revenue', {
          p_dealer_id: dealerId,
          start_date: start.toISOString(),
          end_date: end.toISOString()
        });
      
      if (monthlyError) throw monthlyError;
      
      // Fetch dealer top products
      const { data: topProducts, error: productError } = await supabase
        .rpc('get_dealer_top_products', {
          p_dealer_id: dealerId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          limit_count: 5
        });
      
      if (productError) throw productError;
      
      // Format and return the results
      const result = {
        totalRevenue: {
          value: revenueData.total_revenue || 0,
          change: parseFloat(revenueData.revenue_change.toFixed(1)) || 0,
          isPositive: (revenueData.revenue_change || 0) >= 0
        },
        salesCount: {
          value: revenueData.order_count || 0,
          change: parseFloat(revenueData.order_change.toFixed(1)) || 0,
          isPositive: (revenueData.order_change || 0) >= 0
        },
        monthlyRevenue: monthlyData.map(item => ({
          month: this.getMonthAbbreviation(item.month),
          value: item.revenue
        })),
        topProducts: topProducts.map(item => ({
          name: item.product_name,
          sales: item.units_sold,
          revenue: item.total_revenue
        }))
      };
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      logError('AnalyticsService.getDealerAnalytics', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch dealer analytics'
      };
    }
  }
  
  /**
   * Helper function to get start date based on time range
   * @param {string} timeRange - Time range (month, quarter, year)
   * @returns {Date} - Start date
   */
  static getStartDateFromTimeRange(timeRange) {
    const now = new Date();
    let start;
    
    switch(timeRange) {
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        start = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
    }
    
    return start;
  }
  
  /**
   * Helper function to convert month number to abbreviation
   * @param {number} month - Month number (1-12)
   * @returns {string} - Month abbreviation
   */
  static getMonthAbbreviation(month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  }
}

export default AnalyticsService; 