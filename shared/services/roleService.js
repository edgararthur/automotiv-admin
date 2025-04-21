import supabase from '../supabase/supabaseClient.js';

/**
 * Service for roles and permissions management
 */
const RoleService = {
  /**
   * Get all available roles
   * @returns {Promise} - List of roles
   */
  getAllRoles: async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      return {
        success: true,
        roles: data
      };
    } catch (error) {
      console.error('Error fetching roles:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get a specific role by ID
   * @param {UUID} roleId - Role ID
   * @returns {Promise} - Role details
   */
  getRoleById: async (roleId) => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', roleId)
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        role: data
      };
    } catch (error) {
      console.error('Error fetching role:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Create a new role
   * @param {Object} roleData - Role data
   * @returns {Promise} - Created role
   */
  createRole: async (roleData) => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert({
          name: roleData.name,
          description: roleData.description,
          is_system_role: roleData.is_system_role || false,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select();
      
      if (error) throw error;
      
      // If permissions are provided, assign them to the role
      if (roleData.permissions && roleData.permissions.length > 0) {
        for (const permissionId of roleData.permissions) {
          const { error: permError } = await supabase
            .from('role_permissions')
            .insert({
              role_id: data[0].id,
              permission_id: permissionId
            });
          
          if (permError) throw permError;
        }
      }
      
      return {
        success: true,
        role: data[0]
      };
    } catch (error) {
      console.error('Error creating role:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Update an existing role
   * @param {UUID} roleId - Role ID
   * @param {Object} roleData - Role data
   * @returns {Promise} - Updated role
   */
  updateRole: async (roleId, roleData) => {
    try {
      // Don't allow updating system roles except description
      const { data: existingRole, error: checkError } = await supabase
        .from('roles')
        .select('is_system_role')
        .eq('id', roleId)
        .single();
      
      if (checkError) throw checkError;
      
      // Only allow updating description for system roles
      const updateData = existingRole.is_system_role 
        ? { description: roleData.description, updated_at: new Date() }
        : { 
            name: roleData.name, 
            description: roleData.description,
            updated_at: new Date()
          };
      
      const { data, error } = await supabase
        .from('roles')
        .update(updateData)
        .eq('id', roleId)
        .select();
      
      if (error) throw error;
      
      // If permissions are provided, update them
      if (roleData.permissions) {
        // First delete all existing permissions
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId);
        
        if (deleteError) throw deleteError;
        
        // Then insert new permissions
        for (const permissionId of roleData.permissions) {
          const { error: permError } = await supabase
            .from('role_permissions')
            .insert({
              role_id: roleId,
              permission_id: permissionId
            });
          
          if (permError) throw permError;
        }
      }
      
      return {
        success: true,
        role: data[0]
      };
    } catch (error) {
      console.error('Error updating role:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Delete a role
   * @param {UUID} roleId - Role ID
   * @returns {Promise} - Deletion result
   */
  deleteRole: async (roleId) => {
    try {
      // Check if it's a system role
      const { data: roleData, error: checkError } = await supabase
        .from('roles')
        .select('is_system_role')
        .eq('id', roleId)
        .single();
      
      if (checkError) throw checkError;
      
      if (roleData.is_system_role) {
        return {
          success: false,
          error: 'Cannot delete system roles'
        };
      }
      
      // Check if any users are using this role
      const { data: usersWithRole, error: userCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role_id', roleId);
      
      if (userCheckError) throw userCheckError;
      
      if (usersWithRole && usersWithRole.length > 0) {
        return {
          success: false,
          error: `Cannot delete role: ${usersWithRole.length} users are currently assigned to this role`
        };
      }
      
      // Delete role (role_permissions will be deleted via CASCADE)
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
      
      return {
        success: true,
        message: 'Role deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting role:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get all permissions
   * @returns {Promise} - List of permissions
   */
  getAllPermissions: async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource, action');
      
      if (error) throw error;
      
      return {
        success: true,
        permissions: data
      };
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get permissions for a role
   * @param {UUID} roleId - Role ID
   * @returns {Promise} - List of permissions
   */
  getRolePermissions: async (roleId) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          permissions:permission_id(*)
        `)
        .eq('role_id', roleId);
      
      if (error) throw error;
      
      return {
        success: true,
        permissions: data.map(item => item.permissions)
      };
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Assign role to user
   * @param {UUID} userId - User ID
   * @param {UUID} roleId - Role ID
   * @returns {Promise} - Assignment result
   */
  assignUserRole: async (userId, roleId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role_id: roleId,
          updated_at: new Date()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      return {
        success: true,
        message: 'Role assigned successfully'
      };
    } catch (error) {
      console.error('Error assigning role:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Check if user has specific permission
   * @param {UUID} userId - User ID
   * @param {string} resource - Resource name
   * @param {string} action - Action name
   * @returns {Promise<boolean>} - True if user has permission
   */
  hasPermission: async (userId, resource, action) => {
    try {
      if (!userId) return false;
      
      // Get user's role
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', userId)
        .single();
      
      if (userError || !userData || !userData.role_id) return false;
      
      // Check for 'all' permission first (superuser)
      const { data: allPermData, error: allPermError } = await supabase
        .from('role_permissions')
        .select(`
          permissions!inner(id, resource, action)
        `)
        .eq('role_id', userData.role_id)
        .eq('permissions.resource', 'all')
        .eq('permissions.action', 'all');
      
      if (allPermError) throw allPermError;
      if (allPermData && allPermData.length > 0) return true;
      
      // Check for specific permission
      const { data: permData, error: permError } = await supabase
        .from('role_permissions')
        .select(`
          permissions!inner(id, resource, action)
        `)
        .eq('role_id', userData.role_id)
        .eq('permissions.resource', resource)
        .eq('permissions.action', action);
      
      if (permError) throw permError;
      
      return permData && permData.length > 0;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  },
  
  /**
   * Get all permissions for a user
   * @param {UUID} userId - User ID
   * @returns {Promise} - User's permissions
   */
  getUserPermissions: async (userId) => {
    try {
      // Get user's role
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      if (!userData || !userData.role_id) {
        return { 
          success: true, 
          permissions: [] 
        };
      }
      
      // Get permissions for the role
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          permissions:permission_id(*)
        `)
        .eq('role_id', userData.role_id);
      
      if (error) throw error;
      
      return {
        success: true,
        permissions: data.map(item => item.permissions)
      };
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default RoleService; 