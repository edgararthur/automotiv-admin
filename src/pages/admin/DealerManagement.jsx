import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiX, FiSearch, FiFilter, FiCheckCircle, FiXCircle, FiEye, FiAlertTriangle, FiUser, FiPackage, FiDollarSign, FiCalendar, FiMail, FiEdit2, FiPercent, FiMapPin, FiChevronDown, FiPhone, FiUserPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Mock dealer data
const MOCK_DEALERS = [
  {
    id: 'DLR-1001',
    name: 'AutoParts Express',
    email: 'info@autopartsexpress.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Chicago, IL 60601',
    status: 'Active',
    verified: true,
    joinDate: '2023-01-15T10:30:00',
    productsListed: 156,
    salesVolume: 48500,
    rating: 4.7,
    businessType: 'Retailer',
    contactPerson: 'Michael Johnson',
    taxId: 'TAX-12345678',
    businessLicense: 'BL-987654321',
    verificationDate: '2023-01-20T15:45:00'
  },
  {
    id: 'DLR-1002',
    name: 'Premium Auto Supply',
    email: 'sales@premiumautosupply.com',
    phone: '(555) 234-5678',
    address: '456 Oak Avenue, Detroit, MI 48201',
    status: 'Active',
    verified: true,
    joinDate: '2023-02-05T09:15:00',
    productsListed: 231,
    salesVolume: 72600,
    rating: 4.9,
    businessType: 'Wholesaler',
    contactPerson: 'Sarah Williams',
    taxId: 'TAX-23456789',
    businessLicense: 'BL-876543210',
    verificationDate: '2023-02-10T14:30:00'
  },
  {
    id: 'DLR-1003',
    name: 'Budget Parts Co.',
    email: 'service@budgetparts.com',
    phone: '(555) 345-6789',
    address: '789 Pine Street, Cleveland, OH 44101',
    status: 'Suspended',
    verified: true,
    joinDate: '2023-02-20T11:45:00',
    productsListed: 98,
    salesVolume: 18900,
    rating: 3.2,
    businessType: 'Retailer',
    contactPerson: 'Robert Davis',
    taxId: 'TAX-34567890',
    businessLicense: 'BL-765432109',
    verificationDate: '2023-02-25T10:15:00',
    suspensionReason: 'Multiple customer complaints about product quality'
  },
  {
    id: 'DLR-1004',
    name: 'Elite Auto Parts',
    email: 'contact@eliteautoparts.com',
    phone: '(555) 456-7890',
    address: '101 Maple Road, Dallas, TX 75201',
    status: 'Active',
    verified: true,
    joinDate: '2023-03-10T13:20:00',
    productsListed: 312,
    salesVolume: 96700,
    rating: 4.8,
    businessType: 'Manufacturer',
    contactPerson: 'Patricia Miller',
    taxId: 'TAX-45678901',
    businessLicense: 'BL-654321098',
    verificationDate: '2023-03-15T16:40:00'
  },
  {
    id: 'DLR-1005',
    name: 'Fast Track Components',
    email: 'support@fasttrackauto.com',
    phone: '(555) 567-8901',
    address: '202 Cedar Lane, Miami, FL 33101',
    status: 'Pending',
    verified: false,
    joinDate: '2023-04-05T10:10:00',
    productsListed: 0,
    salesVolume: 0,
    rating: 0,
    businessType: 'Distributor',
    contactPerson: 'Daniel Wilson',
    taxId: 'TAX-56789012',
    businessLicense: 'BL-543210987',
    verificationDate: null,
    pendingDocuments: ['Business registration certificate']
  },
  {
    id: 'DLR-1006',
    name: 'Vintage Auto Specialties',
    email: 'info@vintageautospec.com',
    phone: '(555) 678-9012',
    address: '303 Birch Court, Seattle, WA 98101',
    status: 'Active',
    verified: true,
    joinDate: '2023-04-20T14:55:00',
    productsListed: 87,
    salesVolume: 41200,
    rating: 4.6,
    businessType: 'Specialist',
    contactPerson: 'Emma Thompson',
    taxId: 'TAX-67890123',
    businessLicense: 'BL-432109876',
    verificationDate: '2023-04-25T11:30:00'
  },
  {
    id: 'DLR-1007',
    name: 'International Parts Co.',
    email: 'orders@internationalparts.com',
    phone: '(555) 789-0123',
    address: '404 Elm Boulevard, Los Angeles, CA 90001',
    status: 'Inactive',
    verified: true,
    joinDate: '2023-05-15T09:40:00',
    productsListed: 134,
    salesVolume: 32100,
    rating: 4.1,
    businessType: 'Importer',
    contactPerson: 'James Anderson',
    taxId: 'TAX-78901234',
    businessLicense: 'BL-321098765',
    verificationDate: '2023-05-20T13:15:00'
  }
];

const DealerManagement = () => {
  const [dealers, setDealers] = useState([]);
  const [filteredDealers, setFilteredDealers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [verificationFilter, setVerificationFilter] = useState('All');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('All');
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    // Simulate API call to fetch dealers
    const fetchDealers = () => {
      setIsLoading(true);
      setTimeout(() => {
        setDealers(MOCK_DEALERS);
        setFilteredDealers(MOCK_DEALERS);
        setIsLoading(false);
      }, 800);
    };

    fetchDealers();
  }, []);

  useEffect(() => {
    // Filter and sort dealers whenever filters or sort option changes
    filterAndSortDealers();
  }, [searchTerm, statusFilter, verificationFilter, businessTypeFilter, sortBy, sortOrder, dealers]);

  const filterAndSortDealers = () => {
    let filtered = [...dealers];

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(
        dealer => 
          dealer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dealer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dealer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(dealer => dealer.status === statusFilter);
    }

    // Apply verification filter
    if (verificationFilter !== 'All') {
      if (verificationFilter === 'Verified') {
        filtered = filtered.filter(dealer => dealer.verified);
      } else {
        filtered = filtered.filter(dealer => !dealer.verified);
      }
    }

    // Apply business type filter
    if (businessTypeFilter !== 'All') {
      filtered = filtered.filter(dealer => dealer.businessType === businessTypeFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'joinDate':
        filtered.sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));
        break;
      case 'productsListed':
        filtered.sort((a, b) => a.productsListed - b.productsListed);
        break;
      case 'salesVolume':
        filtered.sort((a, b) => a.salesVolume - b.salesVolume);
        break;
      case 'rating':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }

    if (sortOrder === 'desc') {
      filtered.reverse();
    }

    setFilteredDealers(filtered);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleViewDetails = (dealer) => {
    setSelectedDealer(dealer);
    setShowModal(true);
  };

  const handleApprove = (id) => {
    setDealers(dealers.map(dealer => 
      dealer.id === id ? { ...dealer, status: 'Active', verified: true } : dealer
    ));
  };

  const handleSuspend = (id) => {
    setDealers(dealers.map(dealer => 
      dealer.id === id ? { ...dealer, status: 'Suspended' } : dealer
    ));
  };

  const handleReactivate = (id) => {
    setDealers(dealers.map(dealer => 
      dealer.id === id ? { ...dealer, status: 'Active' } : dealer
    ));
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let bgColor;
    let textColor = 'text-white';
    
    switch (status) {
      case 'Active':
        bgColor = 'bg-green-500';
        break;
      case 'Pending':
        bgColor = 'bg-yellow-500';
        break;
      case 'Suspended':
        bgColor = 'bg-red-500';
        break;
      case 'Inactive':
        bgColor = 'bg-gray-500';
        break;
      default:
        bgColor = 'bg-gray-500';
    }
    
    return (
      <span className={`${bgColor} ${textColor} text-xs px-2 py-1 rounded-full`}>
        {status}
      </span>
    );
  };

  // Table header with sorting capability
  const SortableHeader = ({ label, value }) => {
    return (
      <th 
        scope="col" 
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
        onClick={() => {
          if (sortBy === value) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy(value);
            setSortOrder('asc');
          }
        }}
      >
        <div className="flex items-center">
          {label}
          {sortBy === value && (
            <span className="ml-1">
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dealer Management</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
          <FiUserPlus className="mr-2" /> Add New Dealer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                placeholder="Search dealers..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select
                  className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <FiChevronDown className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                >
                  <option value="All">All Verification</option>
                  <option value="Verified">Verified</option>
                  <option value="Unverified">Unverified</option>
                </select>
                <FiChevronDown className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  value={businessTypeFilter}
                  onChange={(e) => setBusinessTypeFilter(e.target.value)}
                >
                  <option value="All">All Business Types</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Wholesaler">Wholesaler</option>
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Importer">Importer</option>
                  <option value="Specialist">Specialist</option>
                </select>
                <FiChevronDown className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader label="Dealer Name" value="name" />
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                  <SortableHeader label="Join Date" value="joinDate" />
                  <SortableHeader label="Products" value="productsListed" />
                  <SortableHeader label="Sales Volume" value="salesVolume" />
                  <SortableHeader label="Rating" value="rating" />
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDealers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No dealers match your filters
                    </td>
                  </tr>
                ) : (
                  filteredDealers.map((dealer) => (
                    <tr key={dealer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{dealer.name}</div>
                            <div className="text-sm text-gray-500">{dealer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={dealer.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {dealer.verified ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(dealer.joinDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dealer.productsListed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(dealer.salesVolume)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dealer.rating > 0 ? dealer.rating.toFixed(1) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(dealer)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <FiEye size={18} />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900"
                            title="Edit Dealer"
                          >
                            <FiEdit size={18} />
                          </button>
                          {!dealer.verified && (
                            <button
                              onClick={() => handleApprove(dealer.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Verify Dealer"
                            >
                              <FiCheck size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedDealer(dealer);
                              setShowModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Dealer"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dealer Details Modal */}
      {showModal && selectedDealer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-90vh overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">{selectedDealer.name}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                  <FiX size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Dealer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Dealer ID</span>
                      <p>{selectedDealer.id}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status</span>
                      <p><StatusBadge status={selectedDealer.status} /></p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Verification</span>
                      <p>
                        {selectedDealer.verified ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified on {formatDate(selectedDealer.verificationDate)}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Unverified
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Business Type</span>
                      <p>{selectedDealer.businessType}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Join Date</span>
                      <p>{formatDate(selectedDealer.joinDate)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Contact Person</span>
                      <p>{selectedDealer.contactPerson}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Email</span>
                      <p>{selectedDealer.email}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Phone</span>
                      <p>{selectedDealer.phone}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Address</span>
                      <p>{selectedDealer.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Business Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Tax ID</span>
                    <p>{selectedDealer.taxId}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Business License</span>
                    <p>{selectedDealer.businessLicense}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-sm font-medium text-gray-500">Products Listed</span>
                    <p className="text-xl font-semibold">{selectedDealer.productsListed}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-sm font-medium text-gray-500">Sales Volume</span>
                    <p className="text-xl font-semibold">{formatCurrency(selectedDealer.salesVolume)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-sm font-medium text-gray-500">Rating</span>
                    <p className="text-xl font-semibold">{selectedDealer.rating > 0 ? selectedDealer.rating.toFixed(1) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {selectedDealer.status === 'Suspended' && selectedDealer.suspensionReason && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg">
                  <h3 className="text-lg font-medium text-red-800 mb-2">Suspension Information</h3>
                  <p className="text-red-700">{selectedDealer.suspensionReason}</p>
                </div>
              )}

              {selectedDealer.status === 'Pending' && selectedDealer.pendingDocuments && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">Pending Documents</h3>
                  <ul className="list-disc pl-5">
                    {selectedDealer.pendingDocuments.map((doc, index) => (
                      <li key={index} className="text-yellow-700">{doc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-between">
              <div>
                {selectedDealer.status !== 'Active' && (
                  <button 
                    onClick={() => {
                      handleApprove(selectedDealer.id);
                      setShowModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mr-3"
                  >
                    Activate Dealer
                  </button>
                )}
                {selectedDealer.status !== 'Suspended' && selectedDealer.status !== 'Inactive' && (
                  <button 
                    onClick={() => {
                      handleSuspend(selectedDealer.id);
                      setShowModal(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Suspend Dealer
                  </button>
                )}
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
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

export default DealerManagement; 