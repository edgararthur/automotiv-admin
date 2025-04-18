import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiEye, FiCheck, FiX, FiAlertCircle, FiFlag, FiMoreVertical } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Mock product moderation data
const MOCK_PRODUCTS = [
  {
    id: 'PRD-12345',
    name: 'High Performance Brake Pads',
    dealer: 'Premium Auto Parts Inc.',
    dealerId: 'DLR-5721',
    category: 'Brakes & Suspension',
    price: 79.99,
    listingDate: '2023-11-20T08:30:00',
    status: 'pending',
    flags: [
      { type: 'pricing', description: 'Potential price gouging - 40% above category average' }
    ],
    thumbnailUrl: 'https://placehold.co/60x60',
    sku: 'BRK-1234-HD'
  },
  {
    id: 'PRD-23456',
    name: '10W-30 Synthetic Engine Oil (5L)',
    dealer: 'European Auto Specialists',
    dealerId: 'DLR-6234',
    category: 'Oils & Fluids',
    price: 42.50,
    listingDate: '2023-11-21T10:15:00',
    status: 'approved',
    flags: [],
    thumbnailUrl: 'https://placehold.co/60x60',
    sku: 'OIL-1030-5L'
  },
  {
    id: 'PRD-34567',
    name: 'LED Headlight Conversion Kit',
    dealer: 'Performance Parts Pro',
    dealerId: 'DLR-7812',
    category: 'Lighting',
    price: 129.99,
    listingDate: '2023-11-22T14:45:00',
    status: 'flagged',
    flags: [
      { type: 'compliance', description: 'May not be street legal in some states' },
      { type: 'description', description: 'Missing installation requirements' }
    ],
    thumbnailUrl: 'https://placehold.co/60x60',
    sku: 'LGT-H7-LED'
  },
  {
    id: 'PRD-45678',
    name: 'Heavy Duty Floor Mats',
    dealer: 'Off-Road Essentials',
    dealerId: 'DLR-8392',
    category: 'Interior',
    price: 89.95,
    listingDate: '2023-11-23T11:20:00',
    status: 'rejected',
    flags: [
      { type: 'images', description: 'Low quality/blurry product images' },
      { type: 'description', description: 'Missing vehicle compatibility information' }
    ],
    thumbnailUrl: 'https://placehold.co/60x60',
    sku: 'INT-FM-HD'
  },
  {
    id: 'PRD-56789',
    name: 'Performance Exhaust System',
    dealer: 'Import Auto Supply',
    dealerId: 'DLR-9167',
    category: 'Exhaust & Emissions',
    price: 349.99,
    listingDate: '2023-11-24T09:30:00',
    status: 'pending',
    flags: [
      { type: 'compliance', description: 'Need to verify emissions compliance' }
    ],
    thumbnailUrl: 'https://placehold.co/60x60',
    sku: 'EXH-CAT-SS'
  },
  {
    id: 'PRD-67890',
    name: 'Classic Car Radio with Bluetooth',
    dealer: 'Classic Car Components',
    dealerId: 'DLR-1042',
    category: 'Electronics',
    price: 159.00,
    listingDate: '2023-11-25T13:10:00',
    status: 'approved',
    flags: [],
    thumbnailUrl: 'https://placehold.co/60x60',
    sku: 'ELE-RAD-BT'
  },
  {
    id: 'PRD-78901',
    name: 'Lift Kit - 2 inch',
    dealer: 'Truck Parts Unlimited',
    dealerId: 'DLR-1157',
    category: 'Suspension',
    price: 279.99,
    listingDate: '2023-11-26T15:40:00',
    status: 'flagged',
    flags: [
      { type: 'description', description: 'Missing installation complexity warning' },
      { type: 'compatibility', description: 'Vehicle compatibility list may be inaccurate' }
    ],
    thumbnailUrl: 'https://placehold.co/60x60',
    sku: 'SUS-LFT-2IN'
  }
];

const ProductModeration = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('listingDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [productDetails, setProductDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  useEffect(() => {
    // Simulate API call to fetch products for moderation
    const fetchProducts = () => {
      setTimeout(() => {
        setProducts(MOCK_PRODUCTS);
        setFilteredProducts(MOCK_PRODUCTS);
        setLoading(false);
      }, 800);
    };
    
    fetchProducts();
  }, []);

  useEffect(() => {
    // Filter products based on search term and filters
    let result = products;
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(lowerSearchTerm) ||
        product.dealer.toLowerCase().includes(lowerSearchTerm) ||
        product.id.toLowerCase().includes(lowerSearchTerm) ||
        product.sku.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(product => product.status === statusFilter);
    }
    
    if (categoryFilter !== 'all') {
      result = result.filter(product => product.category === categoryFilter);
    }
    
    // Sort products
    result = [...result].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        comparison = a.price - b.price;
      } else if (sortBy === 'listingDate') {
        comparison = new Date(a.listingDate) - new Date(b.listingDate);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredProducts(result);
  }, [products, searchTerm, statusFilter, categoryFilter, sortBy, sortDirection]);

  // Handle sort
  const handleSort = (field) => {
    if (field === sortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };
  
  // Status badge component
  const StatusBadge = ({ status }) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      flagged: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Handle product approval
  const handleApproval = (productId, isApproved) => {
    setProducts(products.map(product => {
      if (product.id === productId) {
        return { 
          ...product, 
          status: isApproved ? 'approved' : 'rejected'
        };
      }
      return product;
    }));
  };
  
  // View product details
  const handleViewDetails = (product) => {
    setProductDetails(product);
    setShowDetails(true);
  };

  // Get unique categories from products
  const categories = ['all', ...new Set(products.map(product => product.category))];

  return (
    <div className="px-6 py-6 w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Moderation</h1>
          <p className="text-gray-600">
            Review and moderate product listings from dealers
          </p>
        </div>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <select
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="flagged">Flagged</option>
          </select>
          
          <select
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
          
          <button
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FiFilter className="mr-2" />
            <span>More Filters</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Product
                    {sortBy === 'name' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category & SKU
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center">
                    Price
                    {sortBy === 'price' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dealer
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('listingDate')}
                >
                  <div className="flex items-center">
                    Listed
                    {sortBy === 'listingDate' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flags
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden">
                          <img 
                            src={product.thumbnailUrl} 
                            alt={product.name} 
                            className="h-10 w-10 object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.category}</div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(product.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.dealer}</div>
                      <div className="text-xs text-gray-500">{product.dealerId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(product.listingDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.flags.length > 0 ? (
                        <div className="flex items-center">
                          <FiFlag className="text-red-500 mr-1" />
                          <span className="text-sm text-red-500">{product.flags.length}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleViewDetails(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        
                        {product.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproval(product.id, true)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <FiCheck className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleApproval(product.id, false)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <FiX className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        
                        {product.status === 'flagged' && (
                          <button 
                            className="text-orange-600 hover:text-orange-900"
                            title="Review flags"
                          >
                            <FiAlertCircle className="h-5 w-5" />
                          </button>
                        )}
                        
                        <button className="text-gray-400 hover:text-gray-600">
                          <FiMoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No products found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Product Detail Modal */}
      {showDetails && productDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 md:mx-0">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1">
                <div className="bg-gray-100 rounded-lg overflow-hidden h-48 flex items-center justify-center">
                  <img 
                    src={productDetails.thumbnailUrl} 
                    alt={productDetails.name}
                    className="object-contain max-h-full"
                  />
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900">Product Information</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">ID:</span>
                      <span>{productDetails.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">SKU:</span>
                      <span>{productDetails.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category:</span>
                      <span>{productDetails.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-medium">{formatCurrency(productDetails.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Listed:</span>
                      <span>{formatDate(productDetails.listingDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <StatusBadge status={productDetails.status} />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900">Dealer Information</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span>{productDetails.dealer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ID:</span>
                      <span>{productDetails.dealerId}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-span-2">
                <h4 className="font-medium text-gray-900">Product Description</h4>
                <p className="mt-2 text-sm text-gray-600">
                  This is a placeholder for the product description which would typically include details about product features, specifications, compatibility, and usage instructions.
                </p>
                
                {productDetails.flags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <FiFlag className="text-red-500 mr-2" />
                      Content Flags ({productDetails.flags.length})
                    </h4>
                    <div className="mt-2 space-y-4">
                      {productDetails.flags.map((flag, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-md p-3">
                          <span className="text-sm font-medium text-red-800">
                            {flag.type.charAt(0).toUpperCase() + flag.type.slice(1)} Issue
                          </span>
                          <p className="mt-1 text-sm text-red-700">
                            {flag.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900">Moderation Actions</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                        <FiCheck className="inline-block mr-2" />
                        Approve Product
                      </button>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                        <FiX className="inline-block mr-2" />
                        Reject Product
                      </button>
                    </div>
                    <div className="mt-4">
                      <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700">
                        Rejection Reason or Feedback (optional)
                      </label>
                      <textarea
                        id="rejection-reason"
                        rows="3"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter feedback for the dealer..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductModeration; 