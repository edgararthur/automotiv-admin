import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../navigation/Sidebar';
import Header from '../navigation/Header';

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentUser } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - hidden on mobile by default, shown on larger screens */}
      <div className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 transform md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:w-64 flex-shrink-0`}>
        <Sidebar portalType="admin" isOpen={isSidebarOpen} onClose={closeSidebar} />
      </div>

      {/* Content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header portalType="admin" toggleSidebar={toggleSidebar} user={currentUser} />
        
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 