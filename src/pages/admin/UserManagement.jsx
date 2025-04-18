import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiEdit, FiTrash2, FiLock, FiUnlock, FiMail, FiUser, FiUserPlus } from 'react-icons/fi';

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
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    type: 'buyer',
    status: 'active'
  });

  useEffect(() => {
    // Simulate API call
    const fetchUsers = () => {
      setTimeout(() => {
        setUsers(MOCK_USERS);
        setLoading(false);
      }, 800);
    };

    fetchUsers();
  }, []);

  // Filter users based on search term, user type, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.company && user.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || user.type === filterType;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle user status update
  const updateUserStatus = (userId, newStatus) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus }
          : user
      )
    );
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

  // Handle add user form submission
  const handleAddUser = (e) => {
    e.preventDefault();
    
    // Create a new user with the form data
    const newUserId = `U${Math.floor(1000 + Math.random() * 9000)}`;
    const currentDate = new Date().toISOString();
    
    const userToAdd = {
      id: newUserId,
      name: newUser.name,
      email: newUser.email,
      type: newUser.type,
      status: newUser.status,
      registeredDate: currentDate,
      lastLoginDate: null,
      ordersCount: 0,
      productsCount: 0,
      location: 'Unknown'
    };
    
    // Add company name if user is a dealer
    if (newUser.type === 'dealer') {
      userToAdd.company = '';
    }
    
    // Add the new user to the users list
    setUsers(prevUsers => [...prevUsers, userToAdd]);
    
    // Reset form and close modal
    setNewUser({
      name: '',
      email: '',
      type: 'buyer',
      status: 'active'
    });
    setShowAddUserModal(false);
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

  return (
    <div className="px-6 py-6 w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users across the platform</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <FiUserPlus className="mr-2" /> Add User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
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
            </div>
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

          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No users found matching your search criteria
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
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
                        {user.type === 'buyer' && (
                          <span>{user.ordersCount} orders</span>
                        )}
                        {user.type === 'dealer' && (
                          <span>{user.productsCount} products</span>
                        )}
                        {user.type === 'admin' && (
                          <span>—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Edit User"
                        >
                          <FiEdit size={18} />
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Email User"
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
                        ) : user.status === 'suspended' ? (
                          <button 
                            onClick={() => updateUserStatus(user.id, 'active')}
                            className="text-green-600 hover:text-green-900 mr-4"
                            title="Reactivate User"
                          >
                            <FiUnlock size={18} />
                          </button>
                        ) : null}
                        <button 
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
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
              
              <div className="mb-6">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={newUser.status}
                  onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
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
    </div>
  );
};

export default UserManagement; 