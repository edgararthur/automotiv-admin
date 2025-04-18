import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiUsers, 
  FiShoppingBag, 
  FiDollarSign, 
  FiPackage,
  FiAlertTriangle,
  FiCheck,
  FiArrowUp,
  FiArrowDown,
  FiChevronRight,
  FiEdit,
  FiMoreVertical
} from 'react-icons/fi';

// Mock data for the admin dashboard
const platformStats = {
  dealers: { value: 48, change: 6.7 },
  products: { value: 12567, change: 12.3 },
  revenue: { value: 843750, change: 8.2 },
  users: { value: 8954, change: 14.5 }
};

const revenueByMonth = [
  { month: 'Jan', value: 42000 },
  { month: 'Feb', value: 51000 },
  { month: 'Mar', value: 63000 },
  { month: 'Apr', value: 58000 },
  { month: 'May', value: 71000 },
  { month: 'Jun', value: 78000 },
  { month: 'Jul', value: 85000 },
  { month: 'Aug', value: 93000 },
  { month: 'Sep', value: 102000 },
  { month: 'Oct', value: 110000 },
  { month: 'Nov', value: 94000 },
  { month: 'Dec', value: 96750 }
];

const topDealers = [
  { id: 1, name: 'Premium Auto Parts Inc.', revenue: 124580, products: 432, status: 'active' },
  { id: 2, name: 'Elite Motor Supplies', revenue: 98730, products: 378, status: 'active' },
  { id: 3, name: 'AutoZone Plus', revenue: 87600, products: 293, status: 'active' },
  { id: 4, name: 'Quality Parts Co.', revenue: 65420, products: 256, status: 'pending' },
  { id: 5, name: 'Motor City Distribution', revenue: 54320, products: 187, status: 'active' }
];

const recentTickets = [
  { 
    id: 'TKT-1234', 
    user: 'Michael Johnson', 
    userType: 'Buyer',
    subject: 'Order not delivered', 
    status: 'Open', 
    priority: 'High',
    created: '2023-11-28T14:23:00Z' 
  },
  { 
    id: 'TKT-1233', 
    user: 'Elite Motor Supplies', 
    userType: 'Dealer',
    subject: 'Payment processing issue', 
    status: 'In Progress', 
    priority: 'Medium',
    created: '2023-11-28T09:45:00Z' 
  },
  { 
    id: 'TKT-1232', 
    user: 'Sarah Williams', 
    userType: 'Buyer',
    subject: 'Wrong part received', 
    status: 'Open', 
    priority: 'Medium',
    created: '2023-11-27T16:12:00Z' 
  },
  { 
    id: 'TKT-1231', 
    user: 'AutoZone Plus', 
    userType: 'Dealer',
    subject: 'Product image upload failing', 
    status: 'Resolved', 
    priority: 'Low',
    created: '2023-11-27T11:05:00Z' 
  }
];

const pendingApprovals = [
  { 
    id: 'PROD-4567', 
    name: 'High Performance Brake Kit', 
    dealer: 'Elite Motor Supplies',
    category: 'Brakes & Suspension',
    submitted: '2023-11-28T10:15:00Z' 
  },
  { 
    id: 'PROD-4566', 
    name: 'LED Headlight Conversion Kit', 
    dealer: 'Premium Auto Parts Inc.',
    category: 'Lighting & Electrical',
    submitted: '2023-11-28T09:30:00Z' 
  },
  { 
    id: 'DEAL-0023', 
    name: 'Performance Parts Pro', 
    dealer: 'New Dealer Application',
    category: 'Dealer Approval',
    submitted: '2023-11-27T14:45:00Z' 
  }
];

// Helper to format dates
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Generate simple chart (in a real app, would use a charting library)
const generateChart = (data) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = 100;
  
  return (
    <div className="flex items-end h-32 space-x-2">
      {data.map((item, index) => (
        <div 
          key={index} 
          className="flex flex-col items-center flex-1"
        >
          <div 
            className="w-full bg-primary-200 hover:bg-primary-300 transition-colors rounded-t"
            style={{ height: `${(item.value / maxValue) * chartHeight}px` }}
          ></div>
          <div className="text-xs text-neutral-500 mt-1">{item.month}</div>
        </div>
      ))}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const getStatusClasses = () => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-success-100 text-success-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-error-100 text-error-800';
      case 'open':
        return 'bg-primary-100 text-primary-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-success-100 text-success-800';
      case 'closed':
        return 'bg-neutral-100 text-neutral-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses()}`}>
      {status}
    </span>
  );
};

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const getPriorityClasses = () => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-error-100 text-error-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-neutral-100 text-neutral-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClasses()}`}>
      {priority}
    </span>
  );
};

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [stats, setStats] = useState(platformStats);
  
  useEffect(() => {
    // In a real app, this would fetch data from an API
    setLoading(true);
    setTimeout(() => {
      setStats(platformStats);
      setLoading(false);
    }, 500);
  }, [timeRange]);
  
  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Welcome back, {currentUser?.name || 'Admin'}
            </h1>
            <p className="mt-1 text-neutral-500">
              Here's the latest on your marketplace platform.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Dealers Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Total Dealers</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-neutral-900">
                  {stats.dealers.value}
                </p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stats.dealers.change >= 0 ? 'text-success-600' : 'text-error-600'
                }`}>
                  {stats.dealers.change >= 0 ? (
                    <FiArrowUp className="self-center flex-shrink-0 h-4 w-4 text-success-500" />
                  ) : (
                    <FiArrowDown className="self-center flex-shrink-0 h-4 w-4 text-error-500" />
                  )}
                  <span className="ml-1">{Math.abs(stats.dealers.change)}%</span>
                </p>
              </div>
            </div>
            <div className="p-3 bg-primary-50 rounded-full">
              <FiUsers className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        {/* Products Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Total Products</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-neutral-900">
                  {stats.products.value.toLocaleString()}
                </p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stats.products.change >= 0 ? 'text-success-600' : 'text-error-600'
                }`}>
                  {stats.products.change >= 0 ? (
                    <FiArrowUp className="self-center flex-shrink-0 h-4 w-4 text-success-500" />
                  ) : (
                    <FiArrowDown className="self-center flex-shrink-0 h-4 w-4 text-error-500" />
                  )}
                  <span className="ml-1">{Math.abs(stats.products.change)}%</span>
                </p>
              </div>
            </div>
            <div className="p-3 bg-primary-50 rounded-full">
              <FiPackage className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        {/* Revenue Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Platform Revenue</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-neutral-900">
                  ${stats.revenue.value.toLocaleString()}
                </p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stats.revenue.change >= 0 ? 'text-success-600' : 'text-error-600'
                }`}>
                  {stats.revenue.change >= 0 ? (
                    <FiArrowUp className="self-center flex-shrink-0 h-4 w-4 text-success-500" />
                  ) : (
                    <FiArrowDown className="self-center flex-shrink-0 h-4 w-4 text-error-500" />
                  )}
                  <span className="ml-1">{Math.abs(stats.revenue.change)}%</span>
                </p>
              </div>
            </div>
            <div className="p-3 bg-primary-50 rounded-full">
              <FiDollarSign className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        {/* Users Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Registered Users</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-neutral-900">
                  {stats.users.value.toLocaleString()}
                </p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stats.users.change >= 0 ? 'text-success-600' : 'text-error-600'
                }`}>
                  {stats.users.change >= 0 ? (
                    <FiArrowUp className="self-center flex-shrink-0 h-4 w-4 text-success-500" />
                  ) : (
                    <FiArrowDown className="self-center flex-shrink-0 h-4 w-4 text-error-500" />
                  )}
                  <span className="ml-1">{Math.abs(stats.users.change)}%</span>
                </p>
              </div>
            </div>
            <div className="p-3 bg-primary-50 rounded-full">
              <FiShoppingBag className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-neutral-900">Platform Revenue</h2>
          <div className="flex space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
              +8.2% vs last year
            </span>
          </div>
        </div>
        {generateChart(revenueByMonth)}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Dealers */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-neutral-900">Top Performing Dealers</h2>
            <Link
              to="/admin/dealers"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center"
            >
              View all
              <FiChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Dealer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {topDealers.map((dealer) => (
                  <tr key={dealer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-neutral-900">{dealer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-neutral-900">${dealer.revenue.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-neutral-900">{dealer.products}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={dealer.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-neutral-400 hover:text-neutral-500">
                        <FiMoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Recent Support Tickets */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-neutral-900">Recent Support Tickets</h2>
            <Link
              to="/admin/support"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center"
            >
              View all
              <FiChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-200">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium text-neutral-900">{ticket.subject}</span>
                      <span className="ml-2 text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                        {ticket.userType}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">
                      {ticket.id} • {ticket.user} • {formatDate(ticket.created)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
            <Link
              to="/admin/support/new"
              className="flex items-center justify-center w-full px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50"
            >
              Create Support Ticket
            </Link>
          </div>
        </div>
      </div>
      {/* Pending Approvals */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-neutral-900">Pending Approvals</h2>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {pendingApprovals.length} items need review
          </span>
        </div>
        <div className="divide-y divide-neutral-200">
          {pendingApprovals.map((item) => (
            <div key={item.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 rounded-full bg-yellow-50">
                  <FiAlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                  <p className="text-sm text-neutral-500">
                    {item.category} • Submitted: {formatDate(item.submitted)}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <FiCheck className="mr-1 h-4 w-4" />
                  Approve
                </button>
                <button className="inline-flex items-center px-3 py-1 border border-neutral-300 text-sm leading-5 font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <FiEdit className="mr-1 h-4 w-4" />
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
          <Link
            to="/admin/approvals"
            className="flex items-center justify-center w-full px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50"
          >
            View All Pending Approvals
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 