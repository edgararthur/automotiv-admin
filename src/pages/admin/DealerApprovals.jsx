import React, { useState, useEffect } from 'react';
import { 
  FiCheck, 
  FiX, 
  FiEye, 
  FiDownload, 
  FiMessageSquare, 
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiAlertTriangle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import DirectUserService from '../../services/DirectUserService';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
/* Force new deployment with proper imports - v2 */
import { UserService, supabase } from 'autoplus-shared';

const DealerApprovals = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [processingIds, setProcessingIds] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Load applications data
  useEffect(() => {
    fetchDealerApplications();
  }, [activeTab]);
  
  const fetchDealerApplications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use UserService to get users with dealer role and filter by verification status
      const statusMapping = {
        'pending': 'PENDING',
        'review': 'PENDING',  // Use PENDING for review too, differentiate in UI only
        'approved': 'APPROVED',
        'rejected': 'REJECTED'
      };
      
      const filters = {
        role: 'dealer'
      };
      
      if (activeTab !== 'all') {
        filters.verification_status = statusMapping[activeTab];
      }
      
      const result = await UserService.getAllUsers(filters);
      
      if (result.success) {
        // Transform user data to the expected application format
        const transformedApplications = result.users.map(user => {
          // Determine UI status - for items in 'review' tab, we need to check if they were previously marked as review
          let uiStatus = user.status;
          // If we're in the review tab, override the status for display purposes
          if (activeTab === 'review' && user.status === 'pending') {
            uiStatus = 'review';
          }
          
          return {
            id: user.dealerInfo?.id || user.id,
            businessName: user.dealerInfo?.company_name || user.company || 'Unknown',
            contactName: user.name,
            email: user.email,
            phone: user.dealerInfo?.phone || user.phone || 'Not provided',
            dateSubmitted: user.dealerInfo?.created_at || user.registeredDate,
            status: uiStatus, // Use UI-specific status
            businessType: user.dealerInfo?.business_type || 'Not specified',
            yearEstablished: user.dealerInfo?.year_established || 'Not specified',
            website: user.dealerInfo?.website || 'Not provided',
            address: {
              street: user.dealerInfo?.address?.street || user.dealerInfo?.street_address || 'Not provided',
              city: user.dealerInfo?.address?.city || user.dealerInfo?.city || 'Not provided',
              state: user.dealerInfo?.address?.state || user.dealerInfo?.region || 'Not provided',
              zipCode: user.dealerInfo?.address?.zip_code || user.dealerInfo?.postal_code || 'Not provided',
              country: user.dealerInfo?.address?.country || user.dealerInfo?.country || 'Not provided'
            },
            taxId: user.dealerInfo?.tax_id || 'Not provided',
            documents: user.dealerInfo?.documents?.map(doc => ({
              name: doc.name || doc.type || 'Document',
              url: doc.url || '#',
              verified: doc.verified || false
            })) || [],
            inventory: {
              categories: user.dealerInfo?.inventory?.categories || [],
              estimatedProducts: user.dealerInfo?.inventory?.estimated_products || 0,
              manufacturers: user.dealerInfo?.inventory?.manufacturers || []
            },
            notes: user.dealerInfo?.notes?.map(note => ({
              author: note.author_name || 'Admin',
              date: note.created_at,
              content: note.content
            })) || [],
            // Store original user data for actions
            userData: user
          };
        });
        
        setApplications(transformedApplications);
      } else {
        throw new Error(result.error || 'Failed to fetch dealer applications');
      }
    } catch (err) {
      console.error('Error fetching dealer applications:', err);
      setError(err.message || 'An error occurred while fetching dealer applications');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter applications based on status
  const filteredApplications = applications;
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Handle application status change
  const handleStatusChange = async (appId, newStatus) => {
    setProcessingIds(prev => [...prev, appId]);
    setError(null);
    setSuccessMessage(null);
    
    console.log('handleStatusChange called with:', { appId, newStatus });
    
    try {
      const application = applications.find(app => app.id === appId);
      if (!application) {
        throw new Error('Application not found');
      }
      
      console.log('Application found:', application);
      
      // Get the user ID from the application
      const userId = application.userData.id;
      console.log('Will update user with ID:', userId);
      
      // Create a temporary DirectDealerService inline since we're having issues
      // with importing the actual file
      const DirectDealerService = {
        async updateDealerStatus(userId, status) {
          try {
            console.log('Attempting direct dealer status update for:', { userId, status });
            
            // Expanded list of possible status values to try
            const statusMappings = {
              'approved': [
                'approved', 'APPROVED', 'Approved', // Text formats
                '1', 1, // Numeric formats
                'A', 'active', 'ACTIVE', 'Active', // Code formats
                'true', true, // Boolean formats
                'verified', 'VERIFIED', 'Verified' // Alternative terms
              ],
              'rejected': [
                'rejected', 'REJECTED', 'Rejected',
                '0', 0, '-1', -1,
                'R', 'inactive', 'INACTIVE', 'Inactive',
                'false', false,
                'declined', 'DECLINED', 'Declined'
              ],
              'pending': [
                'pending', 'PENDING', 'Pending',
                '2', 2,
                'P', 'review', 'REVIEW', 'Review',
                'null', null,
                'awaiting', 'AWAITING', 'Awaiting'
              ]
            };
            
            // Get the appropriate list of values to try based on the requested status
            const statusValues = statusMappings[status.toLowerCase()] || [status];
            
            // First, try to get the current value to see what's already accepted
            const { data: dealer, error: fetchError } = await supabase
              .from('dealers')
              .select('verification_status')
              .eq('user_id', userId)
              .single();
              
            if (!fetchError && dealer) {
              console.log('Current verification_status:', dealer.verification_status);
            }
            
            // Try each status value
            for (const statusValue of statusValues) {
              console.log(`Trying status value: ${statusValue} (${typeof statusValue})`);
              
              const { error } = await supabase
                .from('dealers')
                .update({ verification_status: statusValue })
                .eq('user_id', userId);
                
              if (!error) {
                console.log(`Successfully updated status to ${statusValue}`);
                return { success: true };
              } else {
                console.error(`Failed with status value ${statusValue}:`, error);
              }
            }
            
            // If all status values failed, try updating just the profiles table
            console.log('Trying to update only user profile status');
            const isActive = status === 'approved';
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ is_active: isActive })
              .eq('id', userId);
              
            if (!profileError) {
              console.log('Successfully updated user profile is_active status');
              return { 
                success: true,
                message: 'Updated user active status but could not update dealer verification status'
              };
            }
            
            // If all attempts failed, throw error
            throw new Error('Failed to update dealer status with any format');
          } catch (error) {
            console.error('Direct dealer status update failed:', error);
            return { success: false, error: error.message };
          }
        }
      };
      
      // Map the UI status to a standard status
      const mappedStatus = 
        newStatus === 'approved' ? 'approved' :
        newStatus === 'rejected' ? 'rejected' :
        'pending';
      
      // Try to update the dealer status directly
      const result = await DirectDealerService.updateDealerStatus(userId, mappedStatus);
      
      if (result.success) {
        // Also update user profile status
        await UserService.updateUserStatus(userId, 
          newStatus === 'approved' ? 'active' : 
          newStatus === 'rejected' ? 'suspended' : 
          'pending'
        );
          
        // Update local state
        setApplications(applications.map(app => 
          app.id === appId ? { ...app, status: newStatus } : app
        ));
        
        setSuccessMessage(`Application status updated to ${newStatus}`);
        
        // Refresh the data
        await fetchDealerApplications();
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating dealer status:', error);
      setError(error.message || 'An error occurred while updating status');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== appId));
    }
  };
  
  // Handle document verification
  const handleVerifyDocument = (appId, docName) => {
    // In a real app, this would be an API call
    setApplications(applications.map(app => {
      if (app.id === appId) {
        const updatedDocs = app.documents.map(doc => 
          doc.name === docName ? { ...doc, verified: true } : doc
        );
        return { ...app, documents: updatedDocs };
      }
      return app;
    }));
  };
  
  // Handle adding a note
  const handleAddNote = (appId) => {
    if (!noteText.trim()) return;
    
    // In a real app, this would include the current user's info
    const newNote = {
      author: 'Emily Davis',
      date: new Date().toISOString(),
      content: noteText
    };
    
    setApplications(applications.map(app => {
      if (app.id === appId) {
        return { 
          ...app, 
          notes: [...app.notes, newNote]
        };
      }
      return app;
    }));
    
    setNoteText('');
  };
  
  // Toggle expanded application
  const toggleExpandApp = (appId) => {
    if (expandedAppId === appId) {
      setExpandedAppId(null);
    } else {
      setExpandedAppId(appId);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">Dealer Applications</h1>
        <div className="flex space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {applications.filter(app => app.status === 'pending').length} Pending
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {applications.filter(app => app.status === 'review').length} In Review
          </span>
        </div>
      </div>
      
      {/* Error and Success messages */}
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          {['all', 'pending', 'review', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== 'all' && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-800'
                }`}>
                  {applications.filter(app => app.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Applications list */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent align-[-0.125em]"></div>
            <p className="mt-4 text-neutral-500">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-neutral-100 text-neutral-500 mb-4">
              <FiAlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No applications found</h3>
            <p className="text-neutral-500">
              There are no dealer applications in this category.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {filteredApplications.map((application) => (
              <div key={application.id} className="bg-white">
                {/* Application header - always visible */}
                <div 
                  className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer ${
                    expandedAppId === application.id ? 'bg-neutral-50' : ''
                  }`}
                  onClick={() => toggleExpandApp(application.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-neutral-900">{application.businessName}</h3>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        application.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : application.status === 'review'
                          ? 'bg-blue-100 text-blue-800'
                          : application.status === 'approved'
                          ? 'bg-success-100 text-success-800'
                          : 'bg-error-100 text-error-800'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-neutral-500">
                      <span>ID: {application.id}</span>
                      <span className="mx-2">•</span>
                      <span>Submitted: {formatDate(application.dateSubmitted)}</span>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center">
                    {application.status === 'pending' || application.status === 'review' ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(application.id, 'approved');
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-success-600 hover:bg-success-700"
                          disabled={processingIds.includes(application.id)}
                        >
                          {processingIds.includes(application.id) ? (
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] mr-1"></span>
                          ) : (
                            <FiCheck className="mr-1 h-3 w-3" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(application.id, 'rejected');
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-error-600 hover:bg-error-700"
                          disabled={processingIds.includes(application.id)}
                        >
                          {processingIds.includes(application.id) ? (
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] mr-1"></span>
                          ) : (
                            <FiX className="mr-1 h-3 w-3" />
                          )}
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(application.id, 'review');
                        }}
                        className="inline-flex items-center px-3 py-1 border border-neutral-300 rounded-md shadow-sm text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50"
                        disabled={processingIds.includes(application.id)}
                      >
                        {processingIds.includes(application.id) ? (
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-neutral-500 border-r-transparent align-[-0.125em] mr-1"></span>
                        ) : null}
                        Reopen
                      </button>
                    )}
                    {expandedAppId === application.id ? (
                      <FiChevronUp className="ml-4 h-5 w-5 text-neutral-500" />
                    ) : (
                      <FiChevronDown className="ml-4 h-5 w-5 text-neutral-500" />
                    )}
                  </div>
                </div>
                
                {/* Expanded application details */}
                {expandedAppId === application.id && (
                  <div className="px-6 pb-6 border-t border-neutral-200 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Business Information */}
                      <div className="col-span-2 space-y-6">
                        <div>
                          <h4 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
                            Business Information
                          </h4>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">Business Name</dt>
                              <dd className="mt-1 text-sm text-neutral-900">{application.businessName}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">Business Type</dt>
                              <dd className="mt-1 text-sm text-neutral-900">{application.businessType}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">Year Established</dt>
                              <dd className="mt-1 text-sm text-neutral-900">{application.yearEstablished}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">Tax ID</dt>
                              <dd className="mt-1 text-sm text-neutral-900">{application.taxId}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">Website</dt>
                              <dd className="mt-1 text-sm text-neutral-900">
                                <a href={`https://${application.website}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">
                                  {application.website}
                                </a>
                              </dd>
                            </div>
                          </dl>
                        </div>
                        
                        <div className="border-t border-neutral-200 pt-6">
                          <h4 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
                            Contact Information
                          </h4>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">Contact Name</dt>
                              <dd className="mt-1 text-sm text-neutral-900">{application.contactName}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">Email</dt>
                              <dd className="mt-1 text-sm text-neutral-900">
                                <a href={`mailto:${application.email}`} className="text-primary-600 hover:text-primary-500">
                                  {application.email}
                                </a>
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">Phone</dt>
                              <dd className="mt-1 text-sm text-neutral-900">{application.phone}</dd>
                            </div>
                          </dl>
                        </div>
                        
                        <div className="border-t border-neutral-200 pt-6">
                          <h4 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
                            Business Address
                          </h4>
                          <address className="not-italic text-sm text-neutral-900">
                            {application.address.street}<br />
                            {application.address.city}, {application.address.state} {application.address.zipCode}<br />
                            {application.address.country}
                          </address>
                        </div>
                        
                        <div className="border-t border-neutral-200 pt-6">
                          <h4 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
                            Inventory Information
                          </h4>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">Estimated Products</dt>
                              <dd className="mt-1 text-sm text-neutral-900">{application.inventory.estimatedProducts}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">Categories</dt>
                              <dd className="mt-1 text-sm text-neutral-900">
                                {application.inventory.categories.join(', ')}
                              </dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-neutral-500">Manufacturers</dt>
                              <dd className="mt-1 text-sm text-neutral-900">
                                {application.inventory.manufacturers.join(', ')}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                      
                      {/* Right sidebar for documents and notes */}
                      <div className="col-span-1 space-y-6">
                        {/* Documents */}
                        <div className="bg-neutral-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-neutral-900 mb-3">Verification Documents</h4>
                          <ul className="divide-y divide-neutral-200">
                            {application.documents.map((doc) => (
                              <li key={doc.name} className="py-3 flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${
                                    doc.verified ? 'bg-success-100 text-success-600' : 'bg-yellow-100 text-yellow-600'
                                  }`}>
                                    {doc.verified ? (
                                      <FiCheck className="h-4 w-4" />
                                    ) : (
                                      <FiAlertTriangle className="h-4 w-4" />
                                    )}
                                  </span>
                                  <span className="ml-2 text-sm text-neutral-900">{doc.name}</span>
                                </div>
                                <div className="flex space-x-2">
                                  <button className="text-neutral-500 hover:text-neutral-700">
                                    <FiEye className="h-4 w-4" />
                                  </button>
                                  <button className="text-neutral-500 hover:text-neutral-700">
                                    <FiDownload className="h-4 w-4" />
                                  </button>
                                  {!doc.verified && (
                                    <button 
                                      className="text-success-600 hover:text-success-700"
                                      onClick={() => handleVerifyDocument(application.id, doc.name)}
                                    >
                                      <FiCheck className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Notes section */}
                        <div>
                          <h4 className="text-sm font-medium text-neutral-900 mb-3">Notes & Activity</h4>
                          <div className="bg-neutral-50 rounded-lg p-4 space-y-4">
                            {application.notes.length === 0 ? (
                              <p className="text-sm text-neutral-500 italic">No notes yet</p>
                            ) : (
                              <ul className="space-y-4">
                                {application.notes.map((note, index) => (
                                  <li key={index} className="bg-white p-3 rounded-md shadow-sm">
                                    <div className="flex justify-between items-start">
                                      <span className="text-sm font-medium text-neutral-900">{note.author}</span>
                                      <span className="text-xs text-neutral-500">{formatDate(note.date)}</span>
                                    </div>
                                    <p className="mt-1 text-sm text-neutral-600">{note.content}</p>
                                  </li>
                                ))}
                              </ul>
                            )}
                            
                            {/* Add note form */}
                            <div className="mt-4 pt-4 border-t border-neutral-200">
                              <label htmlFor="note" className="sr-only">Add a note</label>
                              <div>
                                <textarea
                                  id="note"
                                  name="note"
                                  rows={3}
                                  className="shadow-sm block w-full focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-neutral-300 rounded-md"
                                  placeholder="Add a note..."
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                ></textarea>
                              </div>
                              <div className="mt-2 flex justify-end">
                                <button
                                  type="button"
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                  onClick={() => handleAddNote(application.id)}
                                >
                                  <FiMessageSquare className="mr-2 h-4 w-4" />
                                  Add Note
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="pt-4 border-t border-neutral-200">
                          <div className="flex flex-col space-y-2">
                            {application.status === 'pending' && (
                              <button
                                onClick={() => handleStatusChange(application.id, 'review')}
                                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                disabled={processingIds.includes(application.id)}
                              >
                                {processingIds.includes(application.id) ? (
                                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] mr-2"></span>
                                ) : null}
                                Start Review Process
                              </button>
                            )}
                            {application.status === 'review' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(application.id, 'approved')}
                                  className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-success-600 hover:bg-success-700"
                                  disabled={processingIds.includes(application.id)}
                                >
                                  {processingIds.includes(application.id) ? (
                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] mr-2"></span>
                                  ) : (
                                    <FiCheck className="mr-2 h-4 w-4" />
                                  )}
                                  Approve Application
                                </button>
                                <button
                                  onClick={() => handleStatusChange(application.id, 'rejected')}
                                  className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-error-600 hover:bg-error-700"
                                  disabled={processingIds.includes(application.id)}
                                >
                                  {processingIds.includes(application.id) ? (
                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] mr-2"></span>
                                  ) : (
                                    <FiX className="mr-2 h-4 w-4" />
                                  )}
                                  Reject Application
                                </button>
                              </>
                            )}
                            <button
                              className="inline-flex justify-center items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50"
                            >
                              <FiMessageSquare className="mr-2 h-4 w-4" />
                              Contact Applicant
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerApprovals; 