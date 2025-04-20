import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiEdit, FiTrash2, FiLock, FiUnlock, FiMail, FiUser, FiUserPlus, FiDownload, FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import UserService from '/Users/edwardarthur/Desktop/autoplus/shared/services/userService.js';
import { toast } from 'react-toastify';

// Mock data for user management
const MOCK_USERS = [
  {
    id: 'U1001',
    name: 'John Smith',
    email: 'john.smith@example.com',
    type: 'buyer',
    status: 'active',
    registeredDate: '2023-05-12T14:30:00',
    lastLoginDate: '2023-09-10T09:15:00',
    ordersCount: 8,
    location: 'New York, USA'
  },
  {
    id: 'U1002',
    name: 'Emily Jones',
    email: 'emily.jones@example.com',
    type: 'buyer',
    status: 'inactive',
    registeredDate: '2023-04-22T10:15:00',
    lastLoginDate: '2023-07-05T16:30:00',
    ordersCount: 3,
    location: 'Los Angeles, USA'
  },
  {
    id: 'U1003',
    name: 'Michael Chen',
    email: 'michael.chen@autoelite.com',
    type: 'dealer',
    status: 'active',
    registeredDate: '2023-03-18T09:45:00',
    lastLoginDate: '2023-09-11T14:20:00',
    productsCount: 48,
    location: 'Chicago, USA',
    company: 'AutoElite Parts'
  },
  {
    id: 'U1004',
    name: 'Sarah Williams',
    email: 'sarah.williams@lightpro.com',
    type: 'dealer',
    status: 'suspended',
    registeredDate: '2023-06-30T15:50:00',
    lastLoginDate: '2023-09-01T11:05:00',
    productsCount: 35,
    location: 'Dallas, USA',
    company: 'LightPro Auto'
  },
  {
    id: 'U1005',
    name: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    type: 'buyer',
    status: 'active',
    registeredDate: '2023-08-05T13:25:00',
    lastLoginDate: '2023-09-12T10:45:00',
    ordersCount: 1,
    location: 'Miami, USA'
  },
  {
    id: 'U1006',
    name: 'Lisa Brown',
    email: 'lisa.brown@powermax.com',
    type: 'dealer',
    status: 'pending',
    registeredDate: '2023-09-08T08:15:00',
    lastLoginDate: null,
    productsCount: 0,
    location: 'Houston, USA',
    company: 'PowerMax Engineering'
  },
  {
    id: 'U1007',
    name: 'David Wilson',
    email: 'david.wilson@example.com',
    type: 'admin',
    status: 'active',
    registeredDate: '2023-01-15T11:10:00',
    lastLoginDate: '2023-09-12T09:30:00',
    location: 'Seattle, USA'
  }
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'buyer',
    status: 'active',
    company_name: ''
  });

  // Setup auth state listener to refresh token
  useEffect(() => {
    const { data: authListener } = UserService.setupAuthListener();
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Fetch users when filters or pagination changes
  useEffect(() => {
    fetchUsers();
  }, [filterType, filterStatus, pagination.page, pagination.pageSize]);

  // Reset selection when users change
  useEffect(() => {
    setSelectedUsers([]);
    setSelectAll(false);
  }, [users]);

  // Fetch users with current filters and pagination
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const filters = {
        role: filterType,
        status: filterStatus,
        search: searchTerm
      };
      
      const response = await UserService.getAllUsers(
        filters, 
        pagination.page, 
        pagination.pageSize
      );
      
      if (response.success) {
        setUsers(response.users);
        setPagination(response.pagination);
      } else {
        toast.error('Failed to fetch users: ' + response.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('An error occurred while fetching users');
    } finally {
        setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Search users
  const handleSearch = (e) => {
    e.preventDefault();
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual user selection
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Handle bulk action selection
  const handleBulkActionChange = (e) => {
    setBulkAction(e.target.value);
  };

  // Open bulk action confirmation modal
  const openBulkActionModal = () => {
    if (!selectedUsers.length) {
      toast.warn('Please select at least one user');
      return;
    }
    
    if (!bulkAction) {
      toast.warn('Please select an action to perform');
      return;
    }
    
    setShowBulkActionModal(true);
  };

  // Execute bulk action
  const executeBulkAction = async () => {
    if (!selectedUsers.length || !bulkAction) {
      setShowBulkActionModal(false);
      return;
    }
    
    try {
      let response;
      
      switch (bulkAction) {
        case 'activate':
          response = await UserService.bulkUpdateUserStatus(selectedUsers, 'active');
          break;
        case 'deactivate':
          response = await UserService.bulkUpdateUserStatus(selectedUsers, 'inactive');
          break;
        case 'delete':
          response = await UserService.bulkDeleteUsers(selectedUsers);
          break;
        default:
          throw new Error('Invalid bulk action');
      }
      
      if (response.success) {
        toast.success(response.message);
        fetchUsers();
      } else {
        toast.error('Bulk action not fully completed: ' + response.error);
        fetchUsers(); // Still refresh to get updated state
      }
      
      setShowBulkActionModal(false);
      setBulkAction('');
    } catch (error) {
      console.error('Error executing bulk action:', error);
      toast.error('An error occurred during the bulk operation');
      setShowBulkActionModal(false);
    }
  };

  // Handle export users
  const handleExportUsers = async () => {
    try {
      setShowExportModal(false);
      
      // Get filters from current state
      const filters = {
        role: filterType,
        status: filterStatus,
        search: searchTerm
      };
      
      const response = await UserService.exportUsers(filters);
      
      if (response.success) {
        // Create a download link
        const blob = new Blob([response.csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', response.filename);
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
        toast.success('User data exported successfully');
      } else {
        toast.error('Failed to export user data: ' + response.error);
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('An error occurred while exporting user data');
    }
  };

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await UserService.changeUserRole(userId, newRole);
      
      if (response.success) {
        toast.success(response.message);
        fetchUsers(); // Refresh the user list
      } else {
        toast.error('Failed to change user role: ' + response.error);
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      toast.error('An error occurred while changing user role');
    }
  };

  // Handle user status update
  const updateUserStatus = async (userId, newStatus) => {
    try {
      const response = await UserService.updateUserStatus(userId, newStatus);
      
      if (response.success) {
        toast.success(response.message);
        // Update UI optimistically
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus }
          : user
      )
    );
      } else {
        toast.error('Failed to update user status: ' + response.error);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('An error occurred while updating user status');
    }
  };

  // Handle add user form submission
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    try {
      // Convert frontend user type to backend role format
      const userData = {
      name: newUser.name,
      email: newUser.email,
        phone: newUser.phone,
        role: newUser.type.toUpperCase(),
        company_name: newUser.type === 'dealer' ? newUser.company_name : undefined
      };
      
      const response = await UserService.createUser(userData);
      
      if (response.success) {
        toast.success(response.message);
        fetchUsers(); // Refresh the user list
    
    // Reset form and close modal
    setNewUser({
      name: '',
      email: '',
          phone: '',
      type: 'buyer',
          status: 'active',
          company_name: ''
    });
    setShowAddUserModal(false);
      } else {
        toast.error('Failed to create user: ' + response.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('An error occurred while creating the user');
    }
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setCurrentUser(user);
    setShowEditUserModal(true);
  };

  // Handle edit user form submission
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare profile data for update
      const profileData = {
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        role: currentUser.type.toUpperCase(),
        company_name: currentUser.type === 'dealer' ? currentUser.company : undefined,
        location: currentUser.location
      };
      
      const response = await UserService.updateProfile(currentUser.id, profileData);
      
      if (response.success) {
        toast.success('User updated successfully');
        fetchUsers(); // Refresh the user list
        setShowEditUserModal(false);
      } else {
        toast.error('Failed to update user: ' + response.error);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('An error occurred while updating the user');
    }
  };

  // Handle delete user confirmation
  const handleDeleteUserConfirm = (user) => {
    setCurrentUser(user);
    setShowDeleteConfirmModal(true);
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    try {
      const response = await UserService.deleteUser(currentUser.id);
      
      if (response.success) {
        toast.success(response.message);
        setUsers(prevUsers => prevUsers.filter(user => user.id !== currentUser.id));
        setShowDeleteConfirmModal(false);
      } else {
        toast.error('Failed to delete user: ' + response.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('An error occurred while deleting the user');
    }
  };

  // Send password reset link
  const handleSendPasswordReset = async (email) => {
    try {
      const response = await UserService.resetPassword(email);
      
      if (response.success) {
        toast.success('Password reset email sent successfully');
      } else {
        toast.error('Failed to send password reset: ' + response.error);
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('An error occurred while sending password reset');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render status badge based on status
  const renderStatusBadge = (status) => {
    const badgeClasses = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Render user type badge based on type
  const renderTypeBadge = (type) => {
    const badgeClasses = {
      buyer: 'bg-blue-100 text-blue-800',
      dealer: 'bg-purple-100 text-purple-800',
      admin: 'bg-indigo-100 text-indigo-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClasses[type] || 'bg-gray-100 text-gray-800'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  // Filter users based on search term, user type, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.company && user.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || user.type === filterType;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="px-6 py-6 w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users across the platform</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
          >
            <FiDownload className="mr-2" /> Export
          </button>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <FiUserPlus className="mr-2" /> Add User
        </button>
      </div>
        </div>

      {/* Search and filters row */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                placeholder="Search by name, email, or ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          <button type="submit" className="sr-only">Search</button>
        </form>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FiUser className="text-gray-400" />
                <select
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="buyer">Buyers</option>
                  <option value="dealer">Dealers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <FiFilter className="text-gray-400" />
                <select
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

      {/* Bulk actions row */}
      {users.length > 0 && (
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <select
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              value={bulkAction}
              onChange={handleBulkActionChange}
              disabled={selectedUsers.length === 0}
            >
              <option value="">-- Bulk Actions --</option>
              <option value="activate">Activate</option>
              <option value="deactivate">Deactivate</option>
              <option value="delete">Delete</option>
            </select>
            <button
              onClick={openBulkActionModal}
              disabled={!bulkAction || selectedUsers.length === 0}
              className={`px-3 py-2 rounded-lg text-sm ${
                !bulkAction || selectedUsers.length === 0
                  ? 'bg-gray-200 text-gray-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Apply
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {selectedUsers.length} of {users.length} users selected
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No users found matching your search criteria
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className={`hover:bg-gray-50 ${selectedUsers.includes(user.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                            <FiUser className="text-gray-500" size={20} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderTypeBadge(user.type)}
                        {user.company && (
                          <div className="text-xs text-gray-500 mt-1">{user.company}</div>
                        )}
                        <div className="mt-1">
                          <select 
                            className="text-xs border border-gray-300 rounded px-1 py-0.5"
                            value={user.type}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          >
                            <option value="buyer">Buyer</option>
                            <option value="dealer">Dealer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.registeredDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.lastLoginDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.location || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Edit User"
                          onClick={() => handleEditUser(user)}
                        >
                          <FiEdit size={18} />
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Send Password Reset"
                          onClick={() => handleSendPasswordReset(user.email)}
                        >
                          <FiMail size={18} />
                        </button>
                        {user.status === 'active' ? (
                          <button 
                            onClick={() => updateUserStatus(user.id, 'suspended')}
                            className="text-orange-600 hover:text-orange-900 mr-4"
                            title="Suspend User"
                          >
                            <FiLock size={18} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => updateUserStatus(user.id, 'active')}
                            className="text-green-600 hover:text-green-900 mr-4"
                            title="Activate User"
                          >
                            <FiUnlock size={18} />
                          </button>
                        )}
                        <button 
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                          onClick={() => handleDeleteUserConfirm(user)}
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span> to <span className="font-medium">
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                </span> of <span className="font-medium">{pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded ${
                    pagination.page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <FiChevronLeft size={18} />
                </button>
                
                {/* First page */}
                {pagination.page > 2 && (
                  <button
                    onClick={() => handlePageChange(1)}
                    className="px-3 py-1 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded"
                  >
                    1
                  </button>
                )}
                
                {/* Ellipsis if needed */}
                {pagination.page > 3 && (
                  <span className="px-3 py-1">...</span>
                )}
                
                {/* Previous page if not first */}
                {pagination.page > 1 && (
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="px-3 py-1 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded"
                  >
                    {pagination.page - 1}
                  </button>
                )}
                
                {/* Current page */}
                <button
                  className="px-3 py-1 bg-blue-600 text-white border border-blue-600 rounded"
                >
                  {pagination.page}
                </button>
                
                {/* Next page if not last */}
                {pagination.page < pagination.totalPages && (
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="px-3 py-1 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded"
                  >
                    {pagination.page + 1}
                  </button>
                )}
                
                {/* Ellipsis if needed */}
                {pagination.page < pagination.totalPages - 2 && (
                  <span className="px-3 py-1">...</span>
                )}
                
                {/* Last page */}
                {pagination.page < pagination.totalPages - 1 && (
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    className="px-3 py-1 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded"
                  >
                    {pagination.totalPages}
                  </button>
                )}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className={`px-3 py-1 rounded ${
                    pagination.page >= pagination.totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Rows per page:</span>
                <select
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-1"
                  value={pagination.pageSize}
                  onChange={(e) => {
                    const newPageSize = Number(e.target.value);
                    setPagination(prev => ({ 
                      ...prev, 
                      pageSize: newPageSize, 
                      page: 1 // Reset to first page when changing page size
                    }));
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New User</h2>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1">
                  User Type
                </label>
                <select
                  id="userType"
                  value={newUser.type}
                  onChange={(e) => setNewUser({ ...newUser, type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="buyer">Buyer</option>
                  <option value="dealer">Dealer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              {newUser.type === 'dealer' && (
                <div className="mb-4">
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={newUser.company_name}
                    onChange={(e) => setNewUser({ ...newUser, company_name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required={newUser.type === 'dealer'}
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && currentUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser}>
              <div className="mb-4">
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="edit-email"
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="edit-phone"
                  value={currentUser.phone || ''}
                  onChange={(e) => setCurrentUser({ ...currentUser, phone: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="edit-location"
                  value={currentUser.location || ''}
                  onChange={(e) => setCurrentUser({ ...currentUser, location: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {currentUser.type === 'dealer' && (
                <div className="mb-4">
                  <label htmlFor="edit-company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="edit-company"
                    value={currentUser.company || ''}
                    onChange={(e) => setCurrentUser({ ...currentUser, company: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required={currentUser.type === 'dealer'}
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && currentUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Confirm Delete</h2>
              <p className="text-gray-600 mt-2">
                Are you sure you want to delete the user <span className="font-semibold">{currentUser.name}</span>? 
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Confirm Bulk Action</h2>
              <p className="text-gray-600 mt-2">
                {bulkAction === 'delete' ? (
                  <>
                    Are you sure you want to <span className="font-semibold text-red-600">delete</span> {selectedUsers.length} users? 
                    This action cannot be undone.
                  </>
                ) : bulkAction === 'activate' ? (
                  <>
                    Are you sure you want to <span className="font-semibold text-green-600">activate</span> {selectedUsers.length} users?
                  </>
                ) : (
                  <>
                    Are you sure you want to <span className="font-semibold text-orange-600">deactivate</span> {selectedUsers.length} users?
                  </>
                )}
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkActionModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkAction}
                className={`px-4 py-2 text-white rounded-lg ${
                  bulkAction === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700'
                    : bulkAction === 'activate'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Export Users</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
              </div>
              
              <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Export users data to CSV file. You can apply filters before exporting.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="buyer">Buyers</option>
                  <option value="dealer">Dealers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Term (Optional)
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, etc."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                onClick={handleExportUsers}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                <FiDownload className="mr-2" /> Export CSV
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 