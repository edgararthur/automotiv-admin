import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with server-side credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://zlzzdycsizfwjkbulwgt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API endpoint for securely deleting multiple users
 * This must be called server-side to use admin credentials
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Verify admin authorization
  const { authorization } = req.headers;
  if (!await verifyAdminAuthorization(authorization)) {
    return res.status(401).json({ success: false, message: 'Unauthorized access' });
  }

  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'User IDs array is required' });
    }

    // Add safeguard against deleting too many users at once
    if (userIds.length > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'For safety reasons, you cannot delete more than 100 users at once' 
      });
    }

    // Process users in batches for better reliability
    const batchSize = 10;
    const results = {
      success: [],
      failed: []
    };

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      // Process each user in the batch
      await Promise.all(batch.map(async (userId) => {
        try {
          const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
          
          if (error) {
            results.failed.push({ userId, error: error.message });
          } else {
            results.success.push(userId);
          }
        } catch (error) {
          results.failed.push({ userId, error: error.message });
        }
      }));
    }

    // Log the action
    await logAdminAction(req, 'bulk_delete_users', { 
      totalUsers: userIds.length,
      successCount: results.success.length,
      failedCount: results.failed.length 
    });

    // Determine overall success
    const allSucceeded = results.failed.length === 0;
    const statusCode = allSucceeded ? 200 : 207; // 207 Multi-Status

    return res.status(statusCode).json({
      success: results.failed.length === 0,
      message: `Deleted ${results.success.length} out of ${userIds.length} users`,
      results
    });
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete users' 
    });
  }
}

/**
 * Verify the admin authorization
 * @param {string} authHeader - Authorization header
 * @returns {Promise<boolean>} - True if authorized
 */
async function verifyAdminAuthorization(authHeader) {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !data.user) {
      return false;
    }
    
    // Check if user has admin role
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();
      
    if (profileError || !profileData || profileData.role !== 'ADMIN') {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying admin authorization:', error);
    return false;
  }
}

/**
 * Log admin action for audit trail
 * @param {Object} req - Request object
 * @param {string} action - Action performed
 * @param {Object} details - Action details
 */
async function logAdminAction(req, action, details) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { data } = await supabaseAdmin.auth.getUser(token);
    
    if (!data?.user?.id) return;
    
    await supabaseAdmin
      .from('admin_logs')
      .insert({
        admin_id: data.user.id,
        action,
        details,
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        user_agent: req.headers['user-agent'],
        created_at: new Date()
      });
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Non-blocking error - don't stop the main operation if logging fails
  }
} 