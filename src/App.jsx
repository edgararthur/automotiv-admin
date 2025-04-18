import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Auth Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import Unauthorized from './pages/auth/Unauthorized';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import DealerManagement from './pages/admin/DealerManagement';
import DealerApprovals from './pages/admin/DealerApprovals';
import ProductManagement from './pages/admin/ProductManagement';
import ProductModeration from './pages/admin/ProductModeration';
import SupportTickets from './pages/admin/SupportTickets';
import PlatformAnalytics from './pages/admin/PlatformAnalytics';

// Common Components
import LoadingScreen from './components/common/LoadingScreen';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './components/layouts/AdminLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected Admin Routes - Wrapped with AdminLayout */}
          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute>
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dealers" element={
            <ProtectedRoute>
              <AdminLayout>
                <DealerManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dealer-approvals" element={
            <ProtectedRoute>
              <AdminLayout>
                <DealerApprovals />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/products" element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/product-moderation" element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductModeration />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/support-tickets" element={
            <ProtectedRoute>
              <AdminLayout>
                <SupportTickets />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute>
              <AdminLayout>
                <PlatformAnalytics />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 