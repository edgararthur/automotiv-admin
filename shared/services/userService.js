import supabase from '../supabase/supabaseClient.js';
import RoleService from './roleService.js';

/**
 * Service for user authentication and management
 */
const UserService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - Registration result
   */
  registerUser: async (userData) => {
    try {
      // Validate required fields
      if (!userData.email || !userData.password || !userData.name || !userData.phone) {
        throw new Error('Missing required user information');
      }

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
            role: userData.role || 'BUYER' // Default role is BUYER
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // Add additional user data to profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role || 'BUYER',
          created_at: new Date(),
          profile_image: userData.profile_image || null,
          location: userData.location || null,
          company_name: userData.company_name || null,
          is_active: true
        });

      if (profileError) {
        throw profileError;
      }

      // If registering as a dealer, add dealer-specific info
      if (userData.role === 'DEALER' && userData.company_name) {
        const { error: dealerError } = await supabase
          .from('dealers')
          .insert({
            user_id: authData.user.id,
            company_name: userData.company_name,
            location: userData.location || null,
            verification_status: 'PENDING', // Note this is uppercase PENDING
            created_at: new Date()
          });

        if (dealerError) {
          throw dealerError;
        }
      }

      return {
        success: true,
        user: authData.user,
        message: 'User registered successfully'
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Login result
   */
  loginUser: async (email, password) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Handle specific auth errors with more user-friendly messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('The email or password you entered is incorrect');
        } else if (error.message.includes('rate limit')) {
          throw new Error('Too many login attempts. Please try again later');
        } else {
          throw error;
        }
      }

      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      return {
        success: true,
        user: {
          ...data.user,
          profile: profileData
        },
        session: data.session
      };
    } catch (error) {
      console.error('Error logging in:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Logout the current user
   * @returns {Promise} - Logout result
   */
  logoutUser: async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Error logging out:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get the current user session
   * @returns {Promise} - User session
   */
  getCurrentUser: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (!data.session) {
        return {
          success: false,
          message: 'No active session'
        };
      }

      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      return {
        success: true,
        user: {
          ...data.session.user,
          profile: profileData
        },
        session: data.session
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} - Update result
   */
  updateProfile: async (userId, profileData) => {
    try {
      // Add updated_at timestamp
      profileData.updated_at = new Date();

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select();

      if (error) {
        throw error;
      }

      // If updating dealer-specific info
      if (profileData.role === 'DEALER' && profileData.company_name) {
        // Check if dealer record exists first
        const { data: existingDealer, error: checkError } = await supabase
          .from('dealers')
          .select('user_id')
          .eq('user_id', userId)
          .single();
          
        if (checkError && !checkError.message.includes('No rows found')) {
          throw checkError;
        }
        
        // If dealer record doesn't exist, create it
        if (!existingDealer) {
          const { error: insertError } = await supabase
            .from('dealers')
            .insert({
              user_id: userId,
              company_name: profileData.company_name,
              location: profileData.location || null,
              verification_status: 'PENDING',
              created_at: new Date(),
              updated_at: new Date()
            });
            
          if (insertError) {
            throw insertError;
          }
        } else {
          // Update existing dealer record
          const dealerData = {
            company_name: profileData.company_name,
            location: profileData.location || null,
            updated_at: new Date()
          };

          const { error: dealerError } = await supabase
            .from('dealers')
            .update(dealerData)
            .eq('user_id', userId);

          if (dealerError) {
            throw dealerError;
          }
        }
      }

      return {
        success: true,
        profile: data[0],
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Reset password
   * @param {string} email - User email
   * @returns {Promise} - Reset password result
   */
  resetPassword: async (email) => {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Password reset email sent'
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Update password
   * @param {string} newPassword - New password
   * @returns {Promise} - Update password result
   */
  updatePassword: async (newPassword) => {
    try {
      if (!newPassword) {
        throw new Error('New password is required');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      console.error('Error updating password:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Setup auth state listener for token refresh
   * @param {Function} callback - Callback function for auth state changes
   */
  setupAuthListener: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Auth token refreshed');
      }
      if (callback && typeof callback === 'function') {
        callback(event, session);
      }
    });
  },

  /**
   * ADMIN: Get all users with optional filters
   * @param {Object} filters - Optional filters (role, status, search)
   * @param {number} page - Page number for pagination
   * @param {number} pageSize - Number of items per page
   * @returns {Promise} - List of users
   */
  getAllUsers: async (filters = {}, page = 1, pageSize = 20) => {
    try {
      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase
        .from('profiles')
        .select('*, dealers(*)', { count: 'exact' })
        .range(from, to);
      
      // Apply filters if provided
      if (filters.role && filters.role !== 'all') {
        query = query.eq('role', filters.role.toUpperCase());
      }
      
      if (filters.status && filters.status !== 'all') {
        // Convert status names to boolean for is_active field
        if (filters.status === 'active') {
          query = query.eq('is_active', true);
        } else if (filters.status === 'inactive' || filters.status === 'suspended') {
          query = query.eq('is_active', false);
        }
      }
      
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        users: data.map(user => {
          // Format the data to match frontend expectations
          const userType = user.role ? user.role.toLowerCase() : 'buyer';
          let userStatus = 'inactive';
          
          if (user.is_active) {
            userStatus = 'active';
          }
          
          // For dealers, check verification status
          if (userType === 'dealer' && user.dealers && user.dealers.length > 0) {
            if (user.dealers[0].verification_status === 'PENDING') {
              userStatus = 'pending';
            } else if (user.dealers[0].verification_status === 'REJECTED') {
              userStatus = 'suspended';
            }
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            type: userType,
            status: userStatus,
            registeredDate: user.created_at,
            lastLoginDate: user.last_sign_in,
            location: user.location,
            company: user.company_name,
            phone: user.phone,
            // Include dealer-specific info if available
            dealerInfo: user.dealers && user.dealers.length > 0 ? user.dealers[0] : null
          };
        }),
        pagination: {
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        }
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ADMIN: Create a new user
   * @param {Object} userData - User data including email, role, etc.
   * @returns {Promise} - Creation result
   */
  createUser: async (userData) => {
    try {
      // Generate a random temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Register the user with the temporary password
      const result = await UserService.registerUser({
        ...userData,
        password: tempPassword
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create user');
      }
      
      // Send password reset email to let user set their own password
      await UserService.resetPassword(userData.email);
      
      return {
        success: true,
        user: result.user,
        message: 'User created successfully. A password reset email has been sent.'
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ADMIN: Update user status
   * @param {string} userId - User ID
   * @param {string} status - New status (active, inactive, suspended, pending)
   * @returns {Promise} - Update result
   */
  updateUserStatus: async (userId, status, options = {}) => {
    try {
      console.log('UserService.updateUserStatus called with:', { userId, status });
      
      // Determine is_active value based on status
      const isActive = status === 'active';
      
      // Update profile status
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive, updated_at: new Date() })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      // If dealer, also update dealer verification status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile data:', profileError);
        throw profileError;
      }
      
      console.log('Profile data:', profileData);
      
      if (profileData && profileData.role === 'DEALER') {
        // Important: Use only values that match exactly what's already in the database
        // Based on the error logs, the database has check constraint requiring a specific set of values
        let verificationStatus;
        
        if (status === 'active') {
          verificationStatus = 'APPROVED';  // Using uppercase - must match exactly what's in DB
        } else if (status === 'suspended' || status === 'rejected') {
          verificationStatus = 'REJECTED';  // Using uppercase - must match exactly what's in DB
        } else {
          verificationStatus = 'PENDING';   // Using uppercase - must match exactly what's in DB
        }
        
        console.log('Setting dealer verification_status to:', verificationStatus);
        
        // First check existing dealer data
        const { data: dealerData, error: dealerCheckError } = await supabase
          .from('dealers')
          .select('verification_status')
          .eq('user_id', userId)
          .single();
        
        if (dealerCheckError && !dealerCheckError.message.includes('No rows found')) {
          console.error('Error checking dealer data:', dealerCheckError);
          throw dealerCheckError;
        }
        
        console.log('Current dealer verification status:', dealerData?.verification_status);
        
        // Only update if the value is different
        if (!dealerData || dealerData.verification_status !== verificationStatus) {
          const updateData = {
            verification_status: verificationStatus
          };
          
          // Add updated_at field only if it works with the DB schema
          if (options.includeTimestamp !== false) {
            updateData.updated_at = new Date().toISOString();
          }
          
          // Perform the update
          console.log('Updating dealer with:', updateData);
          const { error: dealerError } = await supabase
            .from('dealers')
            .update(updateData)
            .eq('user_id', userId);
          
          if (dealerError) {
            console.error('Error updating dealer:', dealerError);
            
            // If that failed, try a more minimal update without the timestamp
            if (options.includeTimestamp !== false) {
              console.log('Retrying without timestamp');
              return UserService.updateUserStatus(userId, status, { includeTimestamp: false });
            }
            
            throw dealerError;
          }
        } else {
          console.log('No update needed - status already set to:', verificationStatus);
        }
      }
      
      return {
        success: true,
        message: `User status updated to ${status}`
      };
    } catch (error) {
      console.error('Error updating user status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ADMIN: Bulk update user status
   * @param {string[]} userIds - Array of user IDs
   * @param {string} status - New status (active, inactive, suspended, pending)
   * @returns {Promise} - Update result
   */
  bulkUpdateUserStatus: async (userIds, status) => {
    try {
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('No users selected for bulk update');
      }
      
      // Determine is_active value based on status
      const isActive = status === 'active';
      
      // Update profile status for all selected users
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive, updated_at: new Date() })
        .in('id', userIds);
      
      if (error) {
        throw error;
      }

      // For dealers, update verification status
      // First, get all dealers in the selection
      const { data: dealerProfiles, error: dealerFetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'DEALER')
        .in('id', userIds);
      
      if (dealerFetchError) {
        throw dealerFetchError;
      }
      
      if (dealerProfiles && dealerProfiles.length > 0) {
        const dealerIds = dealerProfiles.map(profile => profile.id);
        
        // Use uppercase values for consistency
        let verificationStatus;
        
        if (status === 'active') {
          verificationStatus = 'APPROVED';
        } else if (status === 'suspended' || status === 'rejected') {
          verificationStatus = 'REJECTED';
        } else {
          verificationStatus = 'PENDING';
        }
        
        const { error: dealerError } = await supabase
          .from('dealers')
          .update({ 
            verification_status: verificationStatus,
            updated_at: new Date()
          })
          .in('user_id', dealerIds);
        
        if (dealerError) {
          throw dealerError;
        }
      }
      
      return {
        success: true,
        message: `${userIds.length} users updated to status: ${status}`
      };
    } catch (error) {
      console.error('Error performing bulk user status update:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ADMIN: Delete user
   * @param {string} userId - User ID to delete
   * @returns {Promise} - Deletion result
   */
  deleteUser: async (userId) => {
    try {
      // Get user info first to check if they're a dealer
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (userError) {
        throw userError;
      }
      
      // Delete dealer record if applicable
      if (userData && userData.role === 'DEALER') {
        const { error: dealerError } = await supabase
          .from('dealers')
          .delete()
          .eq('user_id', userId);
        
        if (dealerError) {
          throw dealerError;
        }
      }
      
      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) {
        throw profileError;
      }
      
      // Instead of direct admin call, use a serverless function endpoint
      // This handles the auth user deletion securely with admin rights
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ADMIN: Bulk delete users
   * @param {string[]} userIds - Array of user IDs to delete
   * @returns {Promise} - Deletion result
   */
  bulkDeleteUsers: async (userIds) => {
    try {
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('No users selected for deletion');
      }
      
      // Get all dealers in the selection
      const { data: dealerProfiles, error: dealerFetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'DEALER')
        .in('id', userIds);
      
      if (dealerFetchError) {
        throw dealerFetchError;
      }
      
      // Delete dealer records if applicable
      if (dealerProfiles && dealerProfiles.length > 0) {
        const dealerIds = dealerProfiles.map(profile => profile.id);
        
        const { error: dealerError } = await supabase
          .from('dealers')
          .delete()
          .in('user_id', dealerIds);
        
        if (dealerError) {
          throw dealerError;
        }
      }
      
      // Delete user profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .in('id', userIds);
      
      if (profileError) {
        throw profileError;
      }
      
      // Call secure API endpoint to delete auth users
      const response = await fetch('/api/admin/bulk-delete-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete users');
      }
      
      return {
        success: true,
        message: `${userIds.length} users deleted successfully`
      };
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ADMIN: Get user details by ID
   * @param {string} userId - User ID
   * @returns {Promise} - User details
   */
  getUserDetails: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, dealers(*)')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      // For user auth details, use the non-admin API to get what's accessible
      const { data: userData, error: authError } = await supabase.auth.admin
        .getUserById(userId);
      
      if (authError) {
        console.warn('Could not fetch auth details, continuing with profile data', authError);
        // Continue without auth data, still provide profile information
      }
      
      // Format user data
      const userType = data.role ? data.role.toLowerCase() : 'buyer';
      let userStatus = data.is_active ? 'active' : 'inactive';
      
      // For dealers, use verification status
      if (userType === 'dealer' && data.dealers) {
        if (data.dealers.verification_status === 'PENDING') {
          userStatus = 'pending';
        } else if (data.dealers.verification_status === 'REJECTED') {
          userStatus = 'suspended';
        }
      }
      
      return {
        success: true,
        user: {
          id: data.id,
          name: data.name,
          email: data.email,
          type: userType,
          status: userStatus,
          registeredDate: data.created_at,
          lastLoginDate: userData?.user?.last_sign_in_at || data.last_sign_in,
          location: data.location,
          company: data.company_name,
          phone: data.phone,
          dealerInfo: userType === 'dealer' ? data.dealers : null,
          // Include other relevant auth data if available
          authData: userData?.user
        }
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ADMIN: Export users data
   * @param {Object} filters - Optional filters to apply
   * @returns {Promise} - CSV string with user data
   */
  exportUsers: async (filters = {}) => {
    try {
      // Get all users without pagination
      let query = supabase
        .from('profiles')
        .select('*, dealers(*)');
      
      // Apply filters if provided
      if (filters.role && filters.role !== 'all') {
        query = query.eq('role', filters.role.toUpperCase());
      }
      
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'active') {
          query = query.eq('is_active', true);
        } else if (filters.status === 'inactive' || filters.status === 'suspended') {
          query = query.eq('is_active', false);
        }
      }
      
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Format the data for export
      const formattedData = data.map(user => {
        const userType = user.role ? user.role.toLowerCase() : 'buyer';
        let userStatus = 'inactive';
        
        if (user.is_active) {
          userStatus = 'active';
        }
        
        // For dealers, check verification status
        if (userType === 'dealer' && user.dealers && user.dealers.length > 0) {
          if (user.dealers[0].verification_status === 'PENDING') {
            userStatus = 'pending';
          } else if (user.dealers[0].verification_status === 'REJECTED') {
            userStatus = 'suspended';
          }
        }
        
        return {
          ID: user.id,
          Name: user.name,
          Email: user.email,
          Phone: user.phone,
          Type: userType,
          Status: userStatus,
          "Company Name": user.company_name || '',
          Location: user.location || '',
          "Registration Date": new Date(user.created_at).toLocaleString(),
          "Last Login": user.last_sign_in ? new Date(user.last_sign_in).toLocaleString() : 'Never'
        };
      });
      
      // Convert to CSV
      const headers = Object.keys(formattedData[0]);
      const csvRows = [];
      
      // Add headers
      csvRows.push(headers.join(','));
      
      // Add data rows
      for (const row of formattedData) {
        const values = headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }
      
      return {
        success: true,
        csv: csvRows.join('\n'),
        filename: `users_export_${new Date().toISOString().split('T')[0]}.csv`
      };
    } catch (error) {
      console.error('Error exporting users:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ADMIN: Get user activity logs
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of records to retrieve
   * @returns {Promise} - User activity logs
   */
  getUserActivityLogs: async (userId, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        logs: data || []
      };
    } catch (error) {
      console.error('Error fetching user activity logs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ADMIN: Change user role (updated to use new role system)
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @returns {Promise} - Update result
   */
  changeUserRole: async (userId, roleId) => {
    try {
      if (!userId || !roleId) {
        throw new Error('User ID and role ID are required');
      }
      
      // Get role details
      const roleResult = await RoleService.getRoleById(roleId);
      if (!roleResult.success) {
        throw new Error(`Invalid role ID: ${roleId}`);
      }
      
      // Get current user role
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', userId)
        .single();
      
      if (userError) {
        throw userError;
      }
      
      const currentRoleId = userData.role_id;
      
      // Update user role using RoleService
      const result = await RoleService.assignUserRole(userId, roleId);
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return {
        success: true,
        message: `User role changed successfully`
      };
    } catch (error) {
      console.error('Error changing user role:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Check if user has permission
   * @param {string} userId - User ID
   * @param {string} resource - Resource name
   * @param {string} action - Action name
   * @returns {Promise<boolean>} - Has permission
   */
  hasPermission: async (userId, resource, action) => {
    return RoleService.hasPermission(userId, resource, action);
  },
  
  /**
   * Get user permissions
   * @param {string} userId - User ID
   * @returns {Promise} - Permissions list
   */
  getUserPermissions: async (userId) => {
    return RoleService.getUserPermissions(userId);
  }
};

export default UserService; 