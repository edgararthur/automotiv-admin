import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with server-side credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://zlzzdycsizfwjkbulwgt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API endpoint for securely deleting a user
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
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Delete the user with admin privileges
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      throw error;
    }

    // Log the action
    await logAdminAction(req, 'delete_user', { userId });

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete user' });
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