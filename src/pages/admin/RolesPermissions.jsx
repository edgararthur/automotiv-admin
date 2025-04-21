import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiSearch, FiUsers, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { RoleService, UserService } from 'autoplus-shared/services';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RolesPermissions = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Loading roles and permissions...');
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    email: '',
    role_id: '',
    department: ''
  });
  const [newRoleData, setNewRoleData] = useState({
    id: '',
    name: '',
    description: '',
    permissions: []
  });

  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] });
  const [editingRole, setEditingRole] = useState(null);

  // Fetch roles, permissions, and staff data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch roles
        setLoadingMsg('Loading roles...');
        const rolesResult = await RoleService.getAllRoles();
        if (rolesResult.success) {
          setRoles(rolesResult.roles);
        } else {
          toast.error(`Error loading roles: ${rolesResult.error}`);
        }

        // Fetch permissions
        setLoadingMsg('Loading permissions...');
        const permissionsResult = await RoleService.getAllPermissions();
        if (permissionsResult.success) {
          setPermissions(permissionsResult.permissions);
        } else {
          toast.error(`Error loading permissions: ${permissionsResult.error}`);
        }

        // Fetch staff/users
        setLoadingMsg('Loading users...');
        const staffResult = await UserService.getAllUsers();
        if (staffResult.success) {
          // Format users as staff with roles
          const formattedStaff = staffResult.users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role_id: user.profile?.role_id,
            department: user.profile?.department || '',
            joinedDate: user.registeredDate || user.created_at
          }));
          setStaff(formattedStaff);
        } else {
          toast.error(`Error loading users: ${staffResult.error}`);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle search for staff members
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter staff members based on search term
  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.department && member.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle adding a new staff member
  const handleAddStaff = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newStaffData.name || !newStaffData.email || !newStaffData.role_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoadingMsg('Adding staff member...');
    setLoading(true);
    
    try {
      // Call API to add the staff member
      const result = await UserService.registerUser({
        name: newStaffData.name,
        email: newStaffData.email,
        password: generateTempPassword(), // Generate temporary password
        phone: '',
        role_id: newStaffData.role_id,
        department: newStaffData.department
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Refresh staff list
      const staffResult = await UserService.getAllUsers();
      if (staffResult.success) {
        setStaff(staffResult.users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role_id: user.profile?.role_id,
          department: user.profile?.department || '',
          joinedDate: user.registeredDate || user.created_at
        })));
      }

      setNewStaffData({
        name: '',
        email: '',
        role_id: '',
        department: ''
      });
      setIsAddingStaff(false);
      toast.success('Staff member added successfully');
    } catch (error) {
      console.error('Error adding staff:', error);
      toast.error(`Failed to add staff: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate a temporary password
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Handle editing staff member
  const handleEditStaff = (member) => {
    setSelectedStaff(member);
    setNewStaffData({
      name: member.name,
      email: member.email,
      role_id: member.role_id,
      department: member.department
    });
    setIsEditingStaff(true);
  };

  // Handle updating staff member
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newStaffData.name || !newStaffData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoadingMsg('Updating staff member...');
    setLoading(true);
    
    try {
      // Call API to update the staff member
      const result = await UserService.updateProfile(selectedStaff.id, {
        name: newStaffData.name,
        email: newStaffData.email,
        department: newStaffData.department
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // If role changed, update the role
      if (newStaffData.role_id !== selectedStaff.role_id) {
        const roleResult = await UserService.changeUserRole(selectedStaff.id, newStaffData.role_id);
        if (!roleResult.success) {
          throw new Error(roleResult.error);
        }
      }

      // Refresh staff list
      const staffResult = await UserService.getAllUsers();
      if (staffResult.success) {
        setStaff(staffResult.users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role_id: user.profile?.role_id,
          department: user.profile?.department || '',
          joinedDate: user.registeredDate || user.created_at
        })));
      }

      setIsEditingStaff(false);
      setSelectedStaff(null);
      toast.success('Staff member updated successfully');
    } catch (error) {
      console.error('Error updating staff:', error);
      toast.error(`Failed to update staff: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting staff member
  const handleDeleteStaff = async (id) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      setLoadingMsg('Removing staff member...');
      setLoading(true);
      
      try {
        // Call API to delete the staff member
        const result = await UserService.deleteUser(id);

        if (!result.success) {
          throw new Error(result.error);
        }

        // Update staff list
        setStaff(staff.filter(member => member.id !== id));
        toast.success('Staff member removed successfully');
      } catch (error) {
        console.error('Error deleting staff:', error);
        toast.error(`Failed to remove staff: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle editing role
  const handleEditRole = async (role) => {
    setLoadingMsg('Loading role permissions...');
    setLoading(true);
    
    try {
      // Fetch role permissions
      const permissionsResult = await RoleService.getRolePermissions(role.id);
      if (!permissionsResult.success) {
        throw new Error(permissionsResult.error);
      }
      
      const rolePermissions = permissionsResult.permissions.map(p => p.id);
      
      setSelectedRole(role);
      setNewRoleData({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: rolePermissions
      });
      setIsEditingRole(true);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast.error(`Failed to load role permissions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle updating role
  const handleUpdateRole = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newRoleData.name || !newRoleData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoadingMsg('Updating role...');
    setLoading(true);
    
    try {
      // Call API to update the role
      const result = await RoleService.updateRole(selectedRole.id, {
        name: newRoleData.name,
        description: newRoleData.description,
        permissions: newRoleData.permissions
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Refresh roles list
      const rolesResult = await RoleService.getAllRoles();
      if (rolesResult.success) {
        setRoles(rolesResult.roles);
      }

      setIsEditingRole(false);
      setSelectedRole(null);
      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(`Failed to update role: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get role name by ID
  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown';
  };

  // Handle quick role change
  const handleQuickRoleChange = async (userId, newRoleId) => {
    setLoadingMsg('Changing role...');
    setLoading(true);
    
    try {
      // Call API to change the role
      const result = await UserService.changeUserRole(userId, newRoleId);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update staff list
      const updatedStaff = staff.map(member => 
        member.id === userId 
          ? { ...member, role_id: newRoleId }
          : member
      );
      setStaff(updatedStaff);
      
      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error(`Failed to change role: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = () => {
    setIsAddingRole(true);
    setNewRole({ name: '', description: '', permissions: [] });
  };

  const handleSaveNewRole = async () => {
    if (newRole.name.trim() === '') {
      toast.error('Role name is required');
      return;
    }

    setLoadingMsg('Creating role...');
    setLoading(true);
    
    try {
      // Call API to create the role
      const result = await RoleService.createRole({
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Refresh roles list
      const rolesResult = await RoleService.getAllRoles();
      if (rolesResult.success) {
        setRoles(rolesResult.roles);
      }

      setIsAddingRole(false);
      toast.success('Role created successfully');
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error(`Failed to create role: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      setLoadingMsg('Deleting role...');
      setLoading(true);
      
      try {
        // Call API to delete the role
        const result = await RoleService.deleteRole(roleId);

        if (!result.success) {
          throw new Error(result.error);
        }

        // Refresh roles list
        const rolesResult = await RoleService.getAllRoles();
        if (rolesResult.success) {
          setRoles(rolesResult.roles);
        }

        toast.success('Role deleted successfully');
      } catch (error) {
        console.error('Error deleting role:', error);
        toast.error(`Failed to delete role: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePermissionChange = (permissionId, isEditing) => {
    if (isEditing) {
      // Handle for editing existing role
      setNewRoleData({
        ...newRoleData,
        permissions: newRoleData.permissions.includes(permissionId)
          ? newRoleData.permissions.filter(p => p !== permissionId)
          : [...newRoleData.permissions, permissionId]
      });
    } else {
      // Handle for new role
      setNewRole({
        ...newRole,
        permissions: newRole.permissions.includes(permissionId)
          ? newRole.permissions.filter(p => p !== permissionId)
          : [...newRole.permissions, permissionId]
      });
    }
  };

  // Format permission name for display
  const formatPermissionName = (permission) => {
    if (!permission) return '';
    const resource = permission.resource.charAt(0).toUpperCase() + permission.resource.slice(1);
    const action = permission.action.charAt(0).toUpperCase() + permission.action.slice(1);
    return `${resource} - ${action}`;
  };

  // Get permission info for display
  const getPermissionInfo = (permissionId) => {
    return permissions.find(p => p.id === permissionId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Roles & Permissions" />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
          <div className="text-neutral-600 font-medium">{loadingMsg}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader title="Roles & Permissions" />

      <div className="mb-6 flex justify-between items-center">
        <p className="text-neutral-600">Manage roles and assign permissions to control access to different features of the platform.</p>
        <button
          onClick={handleAddRole}
          className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FiPlus className="mr-2" /> Add Role
        </button>
      </div>

      {/* Add New Role Form */}
      {isAddingRole && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-neutral-200">
          <h3 className="text-lg font-medium mb-4">Add New Role</h3>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Role Name</label>
              <input
                type="text"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                className="w-full p-2 border border-neutral-300 rounded-md"
                placeholder="Enter role name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
              <input
                type="text"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                className="w-full p-2 border border-neutral-300 rounded-md"
                placeholder="Enter role description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Permissions</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {permissions.map(permission => (
                  <div key={permission.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`new-${permission.id}`}
                      checked={newRole.permissions.includes(permission.id)}
                      onChange={() => handlePermissionChange(permission.id, false)}
                      className="h-4 w-4 text-primary-600 border-neutral-300 rounded"
                    />
                    <label htmlFor={`new-${permission.id}`} className="ml-2 text-sm text-neutral-700">
                      {formatPermissionName(permission)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsAddingRole(false)}
              className="bg-white border border-neutral-300 text-neutral-700 py-2 px-4 rounded-md hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNewRole}
              className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 flex items-center"
            >
              <FiCheck className="mr-2" /> Save Role
            </button>
          </div>
        </div>
      )}

      {/* Edit Role Form */}
      {isEditingRole && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-neutral-200">
          <h3 className="text-lg font-medium mb-4">Edit Role</h3>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Role Name</label>
              <input
                type="text"
                value={newRoleData.name}
                onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                className="w-full p-2 border border-neutral-300 rounded-md"
                disabled={selectedRole?.is_system_role}
              />
              {selectedRole?.is_system_role && (
                <p className="text-sm text-amber-600 mt-1">System roles cannot be renamed</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
              <input
                type="text"
                value={newRoleData.description}
                onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                className="w-full p-2 border border-neutral-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Permissions</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {permissions.map(permission => (
                  <div key={permission.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`edit-${permission.id}`}
                      checked={newRoleData.permissions.includes(permission.id)}
                      onChange={() => handlePermissionChange(permission.id, true)}
                      className="h-4 w-4 text-primary-600 border-neutral-300 rounded"
                    />
                    <label htmlFor={`edit-${permission.id}`} className="ml-2 text-sm text-neutral-700">
                      {formatPermissionName(permission)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditingRole(false)}
              className="bg-white border border-neutral-300 text-neutral-700 py-2 px-4 rounded-md hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateRole}
              className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 flex items-center"
            >
              <FiCheck className="mr-2" /> Update Role
            </button>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">System Role</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-neutral-900">{role.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-600">{role.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-600">
                    {role.is_system_role ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        System Role
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Custom Role
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleEditRole(role)}
                    className="text-primary-600 hover:text-primary-900 mr-3"
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-red-600 hover:text-red-900"
                    disabled={role.is_system_role}
                  >
                    <FiTrash2 size={18} className={role.is_system_role ? 'opacity-30' : ''} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RolesPermissions; 