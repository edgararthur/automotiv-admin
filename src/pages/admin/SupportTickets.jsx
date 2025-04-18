import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiEye, FiCheckCircle, FiAlertTriangle, FiMessageCircle } from 'react-icons/fi';

// Mock support ticket data
const MOCK_TICKETS = [
  {
    id: 'TKT-1001',
    subject: 'Payment Processing Issue',
    description: 'Unable to complete payment for order #ORD-5782. The payment gateway returns an error after entering card details.',
    submittedBy: {
      id: 'USR-2342',
      name: 'John Doe',
      email: 'john.doe@example.com',
      type: 'buyer'
    },
    status: 'open',
    priority: 'high',
    assignedTo: null,
    createdAt: '2023-06-10T09:43:11',
    updatedAt: '2023-06-10T09:43:11',
    responses: []
  },
  {
    id: 'TKT-1002',
    subject: 'Request for Dealer Account Upgrade',
    description: 'We have been operating on the platform for over 6 months with excellent feedback. We would like to apply for premium dealer status.',
    submittedBy: {
      id: 'DLR-1001',
      name: 'AutoSpares Unlimited',
      email: 'support@autospares.example.com',
      type: 'dealer'
    },
    status: 'pending',
    priority: 'medium',
    assignedTo: {
      id: 'ADM-103',
      name: 'Admin Lisa'
    },
    createdAt: '2023-06-08T14:22:05',
    updatedAt: '2023-06-09T10:15:33',
    responses: [
      {
        id: 'RES-2001',
        content: 'We are reviewing your request and will get back to you within 2 business days.',
        createdBy: {
          id: 'ADM-103',
          name: 'Admin Lisa'
        },
        createdAt: '2023-06-09T10:15:33'
      }
    ]
  },
  {
    id: 'TKT-1003',
    subject: 'Wrong Item Delivered',
    description: 'I ordered brake pads but received oil filters instead. Order #ORD-4432.',
    submittedBy: {
      id: 'USR-1762',
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      type: 'buyer'
    },
    status: 'in_progress',
    priority: 'high',
    assignedTo: {
      id: 'ADM-101',
      name: 'Admin Mike'
    },
    createdAt: '2023-06-05T11:09:23',
    updatedAt: '2023-06-07T16:44:10',
    responses: [
      {
        id: 'RES-1852',
        content: 'We apologize for the inconvenience. We are contacting the dealer to resolve this issue.',
        createdBy: {
          id: 'ADM-101',
          name: 'Admin Mike'
        },
        createdAt: '2023-06-05T14:32:19'
      },
      {
        id: 'RES-1853',
        content: 'The dealer has confirmed the mistake and will ship the correct item tomorrow. They will also send a return label for the wrong item.',
        createdBy: {
          id: 'ADM-101',
          name: 'Admin Mike'
        },
        createdAt: '2023-06-07T16:44:10'
      }
    ]
  },
  {
    id: 'TKT-1004',
    subject: 'Product Listing Rejection Query',
    description: 'My product listing for "Custom Exhaust System" was rejected. Could you please explain why and how I can fix it?',
    submittedBy: {
      id: 'DLR-1005',
      name: 'Premium Parts Hub',
      email: 'contact@premiumparts.example.com',
      type: 'dealer'
    },
    status: 'resolved',
    priority: 'medium',
    assignedTo: {
      id: 'ADM-102',
      name: 'Admin Emma'
    },
    createdAt: '2023-06-02T08:52:41',
    updatedAt: '2023-06-04T11:31:22',
    responses: [
      {
        id: 'RES-1703',
        content: 'Your listing was rejected because the product images were not clear enough to show the product details. Please upload higher quality images.',
        createdBy: {
          id: 'ADM-102',
          name: 'Admin Emma'
        },
        createdAt: '2023-06-02T15:20:34'
      },
      {
        id: 'RES-1704',
        content: 'Thank you for uploading new images. Your product listing has been approved.',
        createdBy: {
          id: 'ADM-102',
          name: 'Admin Emma'
        },
        createdAt: '2023-06-04T11:31:22'
      }
    ]
  },
  {
    id: 'TKT-1005',
    subject: 'Refund Not Processed',
    description: 'I returned an item 2 weeks ago (Order #ORD-3981) but have not received my refund yet.',
    submittedBy: {
      id: 'USR-1845',
      name: 'Michael Brown',
      email: 'michael.b@example.com',
      type: 'buyer'
    },
    status: 'open',
    priority: 'medium',
    assignedTo: null,
    createdAt: '2023-06-09T16:12:45',
    updatedAt: '2023-06-09T16:12:45',
    responses: []
  },
  {
    id: 'TKT-1006',
    subject: 'Platform Technical Issue',
    description: 'The product search feature is not working properly. It shows no results for "brake pads" even though I know there are many listings.',
    submittedBy: {
      id: 'USR-2098',
      name: 'Emily Wilson',
      email: 'emily.w@example.com',
      type: 'buyer'
    },
    status: 'in_progress',
    priority: 'high',
    assignedTo: {
      id: 'ADM-105',
      name: 'Admin Alex'
    },
    createdAt: '2023-06-08T09:05:18',
    updatedAt: '2023-06-08T14:23:56',
    responses: [
      {
        id: 'RES-1901',
        content: 'Thank you for reporting this issue. Our technical team is investigating the search functionality problem.',
        createdBy: {
          id: 'ADM-105',
          name: 'Admin Alex'
        },
        createdAt: '2023-06-08T14:23:56'
      }
    ]
  },
  {
    id: 'TKT-1007',
    subject: 'Invoice Discrepancy',
    description: 'The invoice for order #ORD-6102 shows incorrect tax amount. The calculated tax seems higher than it should be.',
    submittedBy: {
      id: 'DLR-1002',
      name: 'Genuine Parts Co.',
      email: 'accounting@genuineparts.example.com',
      type: 'dealer'
    },
    status: 'pending',
    priority: 'low',
    assignedTo: {
      id: 'ADM-104',
      name: 'Admin David'
    },
    createdAt: '2023-06-07T10:34:02',
    updatedAt: '2023-06-07T15:49:11',
    responses: [
      {
        id: 'RES-1876',
        content: 'We are reviewing the tax calculation on your invoice and will provide an update soon.',
        createdBy: {
          id: 'ADM-104',
          name: 'Admin David'
        },
        createdAt: '2023-06-07T15:49:11'
      }
    ]
  }
];

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [newResponse, setNewResponse] = useState('');

  useEffect(() => {
    // Simulate API call
    const fetchTickets = () => {
      setTimeout(() => {
        setTickets(MOCK_TICKETS);
        setLoading(false);
      }, 800);
    };

    fetchTickets();
  }, []);

  // Filter tickets based on search term and filters
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.submittedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.submittedBy.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesType = filterType === 'all' || ticket.submittedBy.type === filterType;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setViewMode('detail');
  };

  const handleStatusChange = (ticketId, newStatus) => {
    setTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() } : ticket
      )
    );

    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => ({ ...prev, status: newStatus, updatedAt: new Date().toISOString() }));
    }
  };

  const handleAssignTicket = (ticketId) => {
    // In a real app, this would open a dialog to select an admin
    // For this mock, we'll just assign it to a fixed admin
    const adminAssignment = {
      id: 'ADM-101',
      name: 'Admin Mike'
    };

    setTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.id === ticketId ? { 
          ...ticket, 
          assignedTo: adminAssignment,
          status: ticket.status === 'open' ? 'in_progress' : ticket.status,
          updatedAt: new Date().toISOString() 
        } : ticket
      )
    );

    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => ({ 
        ...prev, 
        assignedTo: adminAssignment,
        status: prev.status === 'open' ? 'in_progress' : prev.status,
        updatedAt: new Date().toISOString() 
      }));
    }
  };

  const handleAddResponse = (ticketId) => {
    if (!newResponse.trim()) return;

    const response = {
      id: `RES-${Math.floor(Math.random() * 10000)}`,
      content: newResponse,
      createdBy: {
        id: 'ADM-101',
        name: 'Admin Mike'
      },
      createdAt: new Date().toISOString()
    };

    setTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.id === ticketId ? { 
          ...ticket, 
          responses: [...ticket.responses, response],
          updatedAt: new Date().toISOString() 
        } : ticket
      )
    );

    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => ({ 
        ...prev, 
        responses: [...prev.responses, response],
        updatedAt: new Date().toISOString() 
      }));
    }

    setNewResponse('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatusBadge = ({ status }) => {
    let badgeClass = 'px-2 py-1 rounded text-xs font-medium';
    
    switch (status) {
      case 'open':
        badgeClass += ' bg-red-100 text-red-800';
        break;
      case 'pending':
        badgeClass += ' bg-yellow-100 text-yellow-800';
        break;
      case 'in_progress':
        badgeClass += ' bg-blue-100 text-blue-800';
        break;
      case 'resolved':
        badgeClass += ' bg-green-100 text-green-800';
        break;
      default:
        badgeClass += ' bg-gray-100 text-gray-800';
    }
    
    const statusLabel = status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    return <span className={badgeClass}>{statusLabel}</span>;
  };

  const PriorityBadge = ({ priority }) => {
    let badgeClass = 'px-2 py-1 rounded text-xs font-medium';
    
    switch (priority) {
      case 'high':
        badgeClass += ' bg-red-100 text-red-800';
        break;
      case 'medium':
        badgeClass += ' bg-yellow-100 text-yellow-800';
        break;
      case 'low':
        badgeClass += ' bg-green-100 text-green-800';
        break;
      default:
        badgeClass += ' bg-gray-100 text-gray-800';
    }
    
    return <span className={badgeClass}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>;
  };

  const UserTypeBadge = ({ type }) => {
    let badgeClass = 'px-2 py-1 rounded text-xs font-medium';
    
    switch (type) {
      case 'buyer':
        badgeClass += ' bg-purple-100 text-purple-800';
        break;
      case 'dealer':
        badgeClass += ' bg-blue-100 text-blue-800';
        break;
      default:
        badgeClass += ' bg-gray-100 text-gray-800';
    }
    
    return <span className={badgeClass}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>;
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
      <h1 className="text-2xl font-bold mb-6">Support Tickets</h1>
      
      {viewMode === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tickets..."
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
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  className="border rounded-lg px-3 py-2"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  className="border rounded-lg px-3 py-2"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Users</option>
                  <option value="buyer">Buyers</option>
                  <option value="dealer">Dealers</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ticket.id}</div>
                        <div className="text-sm text-gray-500">{ticket.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ticket.submittedBy.name}</div>
                        <div className="text-sm text-gray-500">{ticket.submittedBy.email}</div>
                        <div className="mt-1">
                          <UserTypeBadge type={ticket.submittedBy.type} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={ticket.status} />
                        <div className="text-sm text-gray-500 mt-1">
                          {ticket.assignedTo ? `Assigned to ${ticket.assignedTo.name}` : 'Unassigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          onClick={() => handleViewTicket(ticket)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Ticket"
                        >
                          <FiEye size={18} />
                        </button>
                        {!ticket.assignedTo && (
                          <button 
                            onClick={() => handleAssignTicket(ticket.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Assign Ticket"
                          >
                            <FiCheckCircle size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No tickets found matching your search criteria.
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
              {selectedTicket.status !== 'resolved' && (
                <button 
                  onClick={() => handleStatusChange(selectedTicket.id, 'resolved')}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center"
                >
                  <FiCheckCircle className="mr-2" /> Mark as Resolved
                </button>
              )}
              {!selectedTicket.assignedTo && (
                <button 
                  onClick={() => handleAssignTicket(selectedTicket.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
                >
                  <FiCheckCircle className="mr-2" /> Assign to Me
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              <div className="border-b pb-4 mb-6">
                <div className="flex justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
                    <div className="text-gray-500 mb-2">Ticket ID: {selectedTicket.id}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <StatusBadge status={selectedTicket.status} />
                    <div className="mt-2">
                      <PriorityBadge priority={selectedTicket.priority} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Description</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
                  {selectedTicket.description}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Conversation</h3>
                {selectedTicket.responses.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    No responses yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedTicket.responses.map(response => (
                      <div key={response.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{response.createdBy.name}</span>
                          <span className="text-sm text-gray-500">{formatDate(response.createdAt)}</span>
                        </div>
                        <p className="text-gray-700">{response.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedTicket.status !== 'resolved' && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Add Response</h3>
                  <div className="space-y-3">
                    <textarea
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                      placeholder="Type your response here..."
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                    ></textarea>
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
                      onClick={() => handleAddResponse(selectedTicket.id)}
                    >
                      <FiMessageCircle className="mr-2" /> Send Response
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="md:col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Submitted By</h3>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{selectedTicket.submittedBy.name}</span>
                    <span className="text-sm text-gray-500">{selectedTicket.submittedBy.email}</span>
                    <div className="mt-1">
                      <UserTypeBadge type={selectedTicket.submittedBy.type} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Ticket Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span>{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Updated:</span>
                    <span>{formatDate(selectedTicket.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assigned To:</span>
                    <span>{selectedTicket.assignedTo ? selectedTicket.assignedTo.name : 'Unassigned'}</span>
                  </div>
                </div>
              </div>
              
              {selectedTicket.status !== 'resolved' && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Actions</h3>
                  <div className="space-y-2">
                    {selectedTicket.status !== 'in_progress' && (
                      <button
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
                        onClick={() => handleStatusChange(selectedTicket.id, 'in_progress')}
                      >
                        Mark as In Progress
                      </button>
                    )}
                    {selectedTicket.status !== 'pending' && (
                      <button
                        className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 text-sm"
                        onClick={() => handleStatusChange(selectedTicket.id, 'pending')}
                      >
                        Mark as Pending
                      </button>
                    )}
                    <button
                      className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm"
                      onClick={() => handleStatusChange(selectedTicket.id, 'resolved')}
                    >
                      Mark as Resolved
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets; 