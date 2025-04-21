import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiEye, FiCheckCircle, FiXCircle, FiAlertTriangle, FiEdit, FiLoader, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { ProductService } from 'autoplus-shared';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Table, Modal, Form, Input, Select, Tabs, message, Spin } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await ProductService.getProducts();
      
      if (result.success) {
        setProducts(result.products);
      } else {
        toast.error('Failed to fetch products: ' + result.error);
      }
      
      // Fetch categories
      const categoriesResult = await ProductService.getCategories();
      if (categoriesResult.success) {
        setCategories(categoriesResult.categories);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleApproveProduct = async (productId) => {
    try {
      setUpdatingProductId(productId);
      const result = await ProductService.updateProductStatus(productId, 'approved');
      
      if (result.success) {
    setProducts(prevProducts => 
      prevProducts.map(product => 
            product.id === productId 
              ? { ...product, approval_status: 'approved', status: 'active' } 
              : product
          )
        );
        
        toast.success('Product approved successfully');
      } else {
        toast.error('Failed to approve product: ' + result.error);
      }
    } catch (error) {
      console.error('Error approving product:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setUpdatingProductId(null);
    }
  };

  const handleRejectProduct = async (productId) => {
    try {
      setUpdatingProductId(productId);
      const result = await ProductService.updateProductStatus(productId, 'rejected');
      
      if (result.success) {
    setProducts(prevProducts => 
      prevProducts.map(product => 
            product.id === productId 
              ? { ...product, approval_status: 'rejected', status: 'inactive' } 
              : product
          )
        );
        
        toast.success('Product rejected successfully');
      } else {
        toast.error('Failed to reject product: ' + result.error);
      }
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setUpdatingProductId(null);
    }
  };

  const filteredProducts = products.filter(product => {
    // Filter by search term
    const matchesSearch = !searchTerm || 
      (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by status
    const matchesStatus = filterStatus === 'all' || 
      product.status === filterStatus ||
      (filterStatus === 'pending_approval' && product.approval_status === 'pending');
    
    // Filter by category
    const matchesCategory = filterCategory === 'all' || 
      product.category_id === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>
      
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row mb-6 gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
              <input
                type="text"
                placeholder="Search products..."
            className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
        <div className="flex flex-wrap gap-2">
                <select
            className="border border-gray-300 rounded-md px-3 py-2"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
            <option value="all">All Statuses</option>
                  <option value="active">Active</option>
            <option value="inactive">Inactive</option>
                  <option value="pending_approval">Pending Approval</option>
                </select>
              
                <select
            className="border border-gray-300 rounded-md px-3 py-2"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
                  ))}
                </select>
              </div>
            </div>
      
      {/* Product list */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-6 rounded-md shadow text-center">
          <p className="text-gray-500">No products found matching your criteria.</p>
          </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Added
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map(product => (
                <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                      {product.images && product.images[0] ? (
                        <img
                          className="h-10 w-10 rounded-md object-cover mr-3"
                          src={product.images[0]}
                          alt={product.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-200 mr-3 flex items-center justify-center">
                          <FiPackage className="text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.sku}</div>
                      </div>
                    </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                      product.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.approval_status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(product.created_at)}
                      </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleViewProduct(product)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                      <FiEye className="inline mr-1" /> View
                        </button>
                    
                    {product.approval_status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveProduct(product.id)}
                          className="text-green-600 hover:text-green-900 mr-4"
                          disabled={updatingProductId === product.id}
                            >
                          <FiCheckCircle className="inline mr-1" /> Approve
                            </button>
                        
                            <button 
                              onClick={() => handleRejectProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                          disabled={updatingProductId === product.id}
                            >
                          <FiXCircle className="inline mr-1" /> Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
              ))}
              </tbody>
            </table>
          </div>
      )}
      
      {/* Product Detail Modal */}
      {modalOpen && selectedProduct && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black opacity-30"></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                  <button 
                    onClick={() => setModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX size={24} />
                  </button>
          </div>
          
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {selectedProduct.images && selectedProduct.images[0] ? (
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FiPackage size={48} className="text-gray-400" />
                  </div>
                    )}
                    
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {selectedProduct.images && selectedProduct.images.slice(1, 5).map((img, i) => (
                        <img 
                          key={i} 
                          src={img} 
                          alt={`Product ${i+2}`}
                          className="w-full h-16 object-cover rounded-md"
                        />
                      ))}
                </div>
              </div>

                <div>
                    <div className="mb-4">
                      <p className="text-xl font-semibold">{formatCurrency(selectedProduct.price)}</p>
                      <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="font-medium mb-1">Description</h3>
                      <p className="text-gray-600">{selectedProduct.description || 'No description provided.'}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="font-medium mb-1">Status</h3>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedProduct.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedProduct.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedProduct.approval_status || 'Pending'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-1">Category</h3>
                        <p>{selectedProduct.category_name}</p>
                    </div>
                      <div>
                        <h3 className="font-medium mb-1">Dealer</h3>
                        <p>{selectedProduct.dealer_name}</p>
                  </div>
                      <div>
                        <h3 className="font-medium mb-1">Date Added</h3>
                        <p>{formatDate(selectedProduct.created_at)}</p>
                </div>
                <div>
                        <h3 className="font-medium mb-1">Stock</h3>
                        <p>{selectedProduct.stock || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
              <div className="bg-gray-50 p-4 flex justify-end space-x-3 rounded-b-lg">
                {selectedProduct.approval_status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApproveProduct(selectedProduct.id);
                        setModalOpen(false);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      disabled={updatingProductId === selectedProduct.id}
                    >
                      Approve Product
                    </button>
                    <button
                      onClick={() => {
                        handleRejectProduct(selectedProduct.id);
                        setModalOpen(false);
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      disabled={updatingProductId === selectedProduct.id}
                    >
                      Reject Product
                    </button>
                  </>
                )}
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-white text-gray-700 px-4 py-2 rounded-md border hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement; 