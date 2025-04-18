import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiEye, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Mock product data
const MOCK_PRODUCTS = [
  {
    id: 'PRD-1001',
    name: 'Premium Brake Pads',
    sku: 'BP-478-92',
    price: 85.99,
    category: 'Brakes & Suspension',
    dealer: {
      id: 'DLR-1001',
      name: 'AutoSpares Unlimited'
    },
    stock: 45,
    status: 'active',
    listed: '2023-04-12',
    approvalStatus: 'approved',
    sold: 38,
    rating: 4.7,
    thumbnail: 'https://via.placeholder.com/100'
  },
  {
    id: 'PRD-1002',
    name: 'High Performance Oil Filter',
    sku: 'OF-239-41',
    price: 24.50,
    category: 'Engine Parts',
    dealer: {
      id: 'DLR-1002',
      name: 'Genuine Parts Co.'
    },
    stock: 120,
    status: 'active',
    listed: '2023-03-18',
    approvalStatus: 'approved',
    sold: 74,
    rating: 4.5,
    thumbnail: 'https://via.placeholder.com/100'
  },
  {
    id: 'PRD-1003',
    name: 'Heavy Duty Car Battery',
    sku: 'CB-567-32',
    price: 129.99,
    category: 'Electrical Systems',
    dealer: {
      id: 'DLR-1001',
      name: 'AutoSpares Unlimited'
    },
    stock: 28,
    status: 'active',
    listed: '2023-05-02',
    approvalStatus: 'approved',
    sold: 15,
    rating: 4.8,
    thumbnail: 'https://via.placeholder.com/100'
  },
  {
    id: 'PRD-1004',
    name: 'Synthetic Engine Oil 5W-30',
    sku: 'EO-189-75',
    price: 45.99,
    category: 'Fluids & Lubricants',
    dealer: {
      id: 'DLR-1006',
      name: 'AutoFix Solutions'
    },
    stock: 85,
    status: 'active',
    listed: '2023-04-25',
    approvalStatus: 'approved',
    sold: 47,
    rating: 4.6,
    thumbnail: 'https://via.placeholder.com/100'
  },
  {
    id: 'PRD-1005',
    name: 'Performance Air Filter',
    sku: 'AF-291-63',
    price: 39.99,
    category: 'Engine Parts',
    dealer: {
      id: 'DLR-1002',
      name: 'Genuine Parts Co.'
    },
    stock: 0,
    status: 'out_of_stock',
    listed: '2023-03-30',
    approvalStatus: 'approved',
    sold: 52,
    rating: 4.4,
    thumbnail: 'https://via.placeholder.com/100'
  },
  {
    id: 'PRD-1006',
    name: 'Automotive Relay Kit',
    sku: 'RK-673-12',
    price: 18.75,
    category: 'Electrical Systems',
    dealer: {
      id: 'DLR-1001',
      name: 'AutoSpares Unlimited'
    },
    stock: 35,
    status: 'active',
    listed: '2023-05-15',
    approvalStatus: 'approved',
    sold: 9,
    rating: 4.3,
    thumbnail: 'https://via.placeholder.com/100'
  },
  {
    id: 'PRD-1007',
    name: 'Universal Spark Plugs (Set of 4)',
    sku: 'SP-412-88',
    price: 32.50,
    category: 'Engine Parts',
    dealer: {
      id: 'DLR-1005',
      name: 'Premium Parts Hub'
    },
    stock: 48,
    status: 'active',
    listed: '2023-04-08',
    approvalStatus: 'approved',
    sold: 27,
    rating: 4.5,
    thumbnail: 'https://via.placeholder.com/100'
  },
  {
    id: 'PRD-1008',
    name: 'Deluxe Car Cleaning Kit',
    sku: 'CK-987-21',
    price: 59.99,
    category: 'Accessories',
    dealer: {
      id: 'DLR-1006',
      name: 'AutoFix Solutions'
    },
    stock: 15,
    status: 'pending',
    listed: '2023-06-23',
    approvalStatus: 'pending',
    sold: 0,
    rating: 0,
    thumbnail: 'https://via.placeholder.com/100'
  },
  {
    id: 'PRD-1009',
    name: 'LED Headlight Conversion Kit',
    sku: 'HK-741-36',
    price: 169.99,
    category: 'Lighting',
    dealer: {
      id: 'DLR-1005',
      name: 'Premium Parts Hub'
    },
    stock: 12,
    status: 'pending',
    listed: '2023-06-24',
    approvalStatus: 'pending',
    sold: 0,
    rating: 0,
    thumbnail: 'https://via.placeholder.com/100'
  }
];

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

  useEffect(() => {
    // Simulate API call
    const fetchProducts = () => {
      setTimeout(() => {
        setProducts(MOCK_PRODUCTS);
        setLoading(false);
      }, 800);
    };

    fetchProducts();
  }, []);

  // Extract unique categories for the filter
  const categories = [...new Set(products.map(product => product.category))];

  // Filter products based on search term, status filter, and category filter
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.dealer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatusFilter = 
      filterStatus === 'all' || 
      product.status === filterStatus ||
      (filterStatus === 'pending_approval' && product.approvalStatus === 'pending');
    
    const matchesCategoryFilter =
      filterCategory === 'all' ||
      product.category === filterCategory;
    
    return matchesSearch && matchesStatusFilter && matchesCategoryFilter;
  });

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setViewMode('detail');
  };

  const handleApproveProduct = (productId) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId ? { ...product, approvalStatus: 'approved', status: 'active' } : product
      )
    );

    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(prev => ({ ...prev, approvalStatus: 'approved', status: 'active' }));
    }
  };

  const handleRejectProduct = (productId) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId ? { ...product, approvalStatus: 'rejected', status: 'inactive' } : product
      )
    );

    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(prev => ({ ...prev, approvalStatus: 'rejected', status: 'inactive' }));
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);
  };

  const StatusBadge = ({ status }) => {
    let badgeClass = 'px-2 py-1 rounded text-xs font-medium';
    
    switch (status) {
      case 'active':
        badgeClass += ' bg-green-100 text-green-800';
        break;
      case 'pending':
        badgeClass += ' bg-yellow-100 text-yellow-800';
        break;
      case 'out_of_stock':
        badgeClass += ' bg-orange-100 text-orange-800';
        break;
      case 'inactive':
        badgeClass += ' bg-red-100 text-red-800';
        break;
      default:
        badgeClass += ' bg-gray-100 text-gray-800';
    }
    
    const statusLabel = status === 'out_of_stock' ? 'Out of Stock' : status.charAt(0).toUpperCase() + status.slice(1);
    
    return <span className={badgeClass}>{statusLabel}</span>;
  };

  const ApprovalBadge = ({ status }) => {
    let badgeClass = 'px-2 py-1 rounded text-xs font-medium';
    
    switch (status) {
      case 'approved':
        badgeClass += ' bg-blue-100 text-blue-800';
        break;
      case 'pending':
        badgeClass += ' bg-yellow-100 text-yellow-800';
        break;
      case 'rejected':
        badgeClass += ' bg-red-100 text-red-800';
        break;
      default:
        badgeClass += ' bg-gray-100 text-gray-800';
    }
    
    return <span className={badgeClass}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>
      
      {viewMode === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-80"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FiFilter className="text-gray-400" />
                <select
                  className="border rounded-lg px-3 py-2"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  className="border rounded-lg px-3 py-2"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dealer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-md object-cover" src={product.thumbnail} alt={product.name} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.dealer.name}</div>
                        <div className="text-sm text-gray-500">ID: {product.dealer.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={product.status} />
                        <div className="text-sm text-gray-500 mt-1">
                          <ApprovalBadge status={product.approvalStatus} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          onClick={() => handleViewProduct(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEye size={18} />
                        </button>
                        {product.approvalStatus === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveProduct(product.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve product"
                            >
                              <FiCheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => handleRejectProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject product"
                            >
                              <FiXCircle size={18} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No products found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between mb-6">
            <button 
              onClick={() => setViewMode('list')}
              className="text-blue-600 hover:text-blue-900 flex items-center"
            >
              <span className="mr-1">←</span> Back to List
            </button>
            <div className="flex space-x-2">
              {selectedProduct.approvalStatus === 'pending' && (
                <>
                  <button 
                    onClick={() => handleApproveProduct(selectedProduct.id)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center"
                  >
                    <FiCheckCircle className="mr-2" /> Approve Product
                  </button>
                  <button 
                    onClick={() => handleRejectProduct(selectedProduct.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center"
                  >
                    <FiXCircle className="mr-2" /> Reject Product
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              <div className="border-b pb-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-20 w-20">
                    <img className="h-20 w-20 rounded-md object-cover" src={selectedProduct.thumbnail} alt={selectedProduct.name} />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                    <div className="text-gray-500 mb-2">SKU: {selectedProduct.sku}</div>
                    <div className="flex items-center space-x-4">
                      <StatusBadge status={selectedProduct.status} />
                      <ApprovalBadge status={selectedProduct.approvalStatus} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Product Details</h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="text-gray-500 w-32">Category:</span>
                      <span>{selectedProduct.category}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">Price:</span>
                      <span>{formatCurrency(selectedProduct.price)}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">Stock:</span>
                      <span>{selectedProduct.stock} units</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">Listed:</span>
                      <span>{formatDate(selectedProduct.listed)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Performance</h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="text-gray-500 w-32">Sold:</span>
                      <span>{selectedProduct.sold} units</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">Revenue:</span>
                      <span>{formatCurrency(selectedProduct.sold * selectedProduct.price)}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">Rating:</span>
                      <span>{selectedProduct.rating > 0 ? `${selectedProduct.rating}/5` : 'Not rated'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Dealer Information</h3>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{selectedProduct.dealer.name}</span>
                    <span className="text-sm text-gray-500">ID: {selectedProduct.dealer.id}</span>
                  </div>
                  <div className="mt-4">
                    <Link 
                      to={`/admin/dealers/${selectedProduct.dealer.id}`} 
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      View Dealer Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Product Description</h3>
            </div>
            <div className="text-gray-500 py-4">
              <p>Detailed product description would be displayed here in a real implementation.</p>
              <p className="mt-2">This would include features, specifications, compatibility information, and other relevant details about the product.</p>
            </div>
          </div>
          
          <div className="border-t pt-6 mt-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Product Reviews</h3>
              <span className="text-sm text-gray-500">{selectedProduct.rating > 0 ? `${selectedProduct.rating}/5 (${selectedProduct.sold} reviews)` : 'No reviews yet'}</span>
            </div>
            <div className="text-gray-500 text-center py-4">
              {selectedProduct.rating > 0 ? 
                "Customer reviews would be displayed here in a real implementation." : 
                "This product has not received any reviews yet."
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement; 