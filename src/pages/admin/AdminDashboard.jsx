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

// Use direct service implementations to avoid import issues
import DirectDealerService from '../../services/DirectDealerService';
import DirectUserService from '../../services/DirectUserService';
import DirectProductService from '../../services/DirectProductService';
import DirectOrderService from '../../services/DirectOrderService';

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
  const [error, setError] = useState(null);
  
  // State for dashboard data
  const [platformStats, setPlatformStats] = useState({
    dealers: { value: 0, change: 0 },
    products: { value: 0, change: 0 },
    revenue: { value: 0, change: 0 },
    users: { value: 0, change: 0 }
  });
  
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [topDealers, setTopDealers] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
    setLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel
        const [dealersResult, usersResult, productsResult, ordersResult] = await Promise.all([
          DirectDealerService.getDealers(),
          DirectUserService.getAllUsers(),
          DirectProductService.getProducts(),
          DirectOrderService.getOrders({ limit: 100 }) // Limit to most recent 100 orders for analytics
        ]);
        
        if (dealersResult.success && usersResult.success && productsResult.success && ordersResult.success) {
          // Calculate platform stats
          const dealers = dealersResult.dealers;
          const users = usersResult.users;
          const products = productsResult.products;
          const orders = ordersResult.orders;
          
          // Calculate revenue
          const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
          
          // Get month-by-month revenue
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          
          // Initialize revenue data for each month
          const monthlyRevenue = monthNames.map(month => ({ month, value: 0 }));
          
          // Populate with actual data
          orders.forEach(order => {
            const orderDate = new Date(order.created_at);
            // Only include orders from the current year
            if (orderDate.getFullYear() === currentYear) {
              const month = orderDate.getMonth();
              monthlyRevenue[month].value += (order.total_amount || 0);
            }
          });
          
          // Prepare top dealers
          const dealerMap = new Map();
          orders.forEach(order => {
            if (order.dealer_id) {
              if (!dealerMap.has(order.dealer_id)) {
                dealerMap.set(order.dealer_id, { revenue: 0, products: 0 });
              }
              dealerMap.get(order.dealer_id).revenue += (order.total_amount || 0);
              dealerMap.get(order.dealer_id).products += (order.items?.length || 0);
            }
          });
          
          // Create top dealers array
          const topDealersList = dealers
            .map(dealer => {
              const stats = dealerMap.get(dealer.id) || { revenue: 0, products: 0 };
              return {
                id: dealer.id,
                name: dealer.company_name || dealer.name,
                revenue: stats.revenue,
                products: stats.products,
                status: dealer.verification_status === 'APPROVED' ? 'active' : 
                       dealer.verification_status === 'PENDING' ? 'pending' :
                       dealer.verification_status === 'REJECTED' ? 'suspended' : 'inactive'
              };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
          
          // Get pending approvals
          const pendingDealers = dealers.filter(dealer => 
            dealer.verification_status === 'PENDING'
          ).slice(0, 3).map(dealer => ({
            id: dealer.id,
            name: dealer.company_name || dealer.name,
            dealer: 'New Dealer Application',
            category: 'Dealer Approval',
            submitted: dealer.created_at
          }));
          
          const pendingProducts = products.filter(product => 
            product.approval_status === 'pending'
          ).slice(0, 3).map(product => ({
            id: product.id,
            name: product.name,
            dealer: dealers.find(d => d.id === product.dealer_id)?.company_name || 'Unknown',
            category: product.category,
            submitted: product.created_at
          }));
          
          // Set all the state data
          setPlatformStats({
            dealers: { 
              value: dealers.length, 
              change: 0 // We would need historical data to calculate change
            },
            products: { 
              value: products.length, 
              change: 0 
            },
            revenue: { 
              value: totalRevenue, 
              change: 0 
            },
            users: { 
              value: users.length, 
              change: 0 
            }
          });
          
          setRevenueByMonth(monthlyRevenue);
          setTopDealers(topDealersList);
          setPendingApprovals([...pendingProducts, ...pendingDealers]);
          
          // For recent tickets, we would need a ticket service
          // This is left as mock data for now
          setRecentTickets([]);
          
        } else {
          throw new Error('Failed to fetch some dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'An error occurred while loading dashboard data');
      } finally {
      setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
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
                  {platformStats.dealers.value}
                </p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  platformStats.dealers.change >= 0 ? 'text-success-600' : 'text-error-600'
                }`}>
                  {platformStats.dealers.change >= 0 ? (
                    <FiArrowUp className="self-center flex-shrink-0 h-4 w-4 text-success-500" />
                  ) : (
                    <FiArrowDown className="self-center flex-shrink-0 h-4 w-4 text-error-500" />
                  )}
                  <span className="ml-1">{Math.abs(platformStats.dealers.change)}%</span>
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
                  {platformStats.products.value.toLocaleString()}
                </p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  platformStats.products.change >= 0 ? 'text-success-600' : 'text-error-600'
                }`}>
                  {platformStats.products.change >= 0 ? (
                    <FiArrowUp className="self-center flex-shrink-0 h-4 w-4 text-success-500" />
                  ) : (
                    <FiArrowDown className="self-center flex-shrink-0 h-4 w-4 text-error-500" />
                  )}
                  <span className="ml-1">{Math.abs(platformStats.products.change)}%</span>
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
                  ${platformStats.revenue.value.toLocaleString()}
                </p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  platformStats.revenue.change >= 0 ? 'text-success-600' : 'text-error-600'
                }`}>
                  {platformStats.revenue.change >= 0 ? (
                    <FiArrowUp className="self-center flex-shrink-0 h-4 w-4 text-success-500" />
                  ) : (
                    <FiArrowDown className="self-center flex-shrink-0 h-4 w-4 text-error-500" />
                  )}
                  <span className="ml-1">{Math.abs(platformStats.revenue.change)}%</span>
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
                  {platformStats.users.value.toLocaleString()}
                </p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  platformStats.users.change >= 0 ? 'text-success-600' : 'text-error-600'
                }`}>
                  {platformStats.users.change >= 0 ? (
                    <FiArrowUp className="self-center flex-shrink-0 h-4 w-4 text-success-500" />
                  ) : (
                    <FiArrowDown className="self-center flex-shrink-0 h-4 w-4 text-error-500" />
                  )}
                  <span className="ml-1">{Math.abs(platformStats.users.change)}%</span>
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