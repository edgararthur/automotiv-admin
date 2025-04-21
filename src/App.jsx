import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PermissionProtectedRoute from './components/auth/PermissionProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Unauthorized from './pages/auth/Unauthorized';

// Admin Pages
import AdminLayout from './components/layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import DealerManagement from './pages/admin/DealerManagement';
import DealerApprovals from './pages/admin/DealerApprovals';
import ProductManagement from './pages/admin/ProductManagement';
import ProductModeration from './pages/admin/ProductModeration';
import SupportTickets from './pages/admin/SupportTickets';
import PlatformAnalytics from './pages/admin/PlatformAnalytics';
import RolesPermissions from './pages/admin/RolesPermissions';

// Test Component
import TestShared from './pages/testing/TestShared';
import ProtectedRoute from './components/auth/ProtectedRoute';

function AppContent() {
  const { currentUser, loading } = useAuth();
  
  // Log user info for debugging at the top level
  console.log('AppContent: Current User', {
    hasUser: !!currentUser,
    loading,
    userRole: currentUser?.profile?.role || currentUser?.profile?.roles?.name || currentUser?.profile?.user_type,
    permissions: currentUser?.profile?.permissions || []
  });
  
  return (
    <Router>
      {currentUser && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 9999, 
          backgroundColor: '#10B981', 
          color: 'white',
          padding: '4px 8px',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          Logged in as: {currentUser.profile?.user_type} | 
          Role: {currentUser.profile?.role || currentUser.profile?.roles?.name} | 
          Permissions: {(currentUser.profile?.permissions || []).length}
        </div>
      )}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/test-shared" element={<TestShared />} />
        
        {/* Protected Admin Routes - Wrapped with AdminLayout */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          
          {/* User management routes - requires users.view permission */}
          <Route path="users" element={
            <PermissionProtectedRoute 
              user={currentUser} 
              requiredPermissions={['users.view']}
            >
              <UserManagement />
            </PermissionProtectedRoute>
          } />
          
          {/* Roles management - requires roles.manage permission */}
          <Route path="roles" element={
            <PermissionProtectedRoute 
              user={currentUser} 
              requiredPermissions={['roles.manage']}
            >
              <RolesPermissions />
            </PermissionProtectedRoute>
          } />
          
          {/* Products management - requires products.view permission */}
          <Route path="products" element={
            <PermissionProtectedRoute 
              user={currentUser} 
              requiredPermissions={['products.view']}
            >
              <ProductManagement />
            </PermissionProtectedRoute>
          } />
          
          {/* Other routes... */}
          <Route path="dealers" element={
            <PermissionProtectedRoute 
              user={currentUser} 
              requiredPermissions={['dealers.view']}
            >
              <DealerManagement />
            </PermissionProtectedRoute>
          } />
          
          <Route path="dealer-approvals" element={
            <PermissionProtectedRoute 
              user={currentUser} 
              requiredPermissions={['dealers.approve']}
            >
              <DealerApprovals />
            </PermissionProtectedRoute>
          } />
          
          <Route path="product-moderation" element={
            <PermissionProtectedRoute 
              user={currentUser} 
              requiredPermissions={['products.moderate']}
            >
              <ProductModeration />
            </PermissionProtectedRoute>
          } />
          
          <Route path="support-tickets" element={
            <PermissionProtectedRoute 
              user={currentUser} 
              requiredPermissions={['support.view']}
            >
              <SupportTickets />
            </PermissionProtectedRoute>
          } />
          
          <Route path="analytics" element={
            <PermissionProtectedRoute 
              user={currentUser} 
              requiredPermissions={['analytics.view']}
            >
              <PlatformAnalytics />
            </PermissionProtectedRoute>
          } />
        </Route>
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 