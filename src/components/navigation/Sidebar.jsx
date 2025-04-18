import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../common/Logo';
import { 
  FiHome, 
  FiPackage, 
  FiShoppingCart, 
  FiSettings, 
  FiBarChart2, 
  FiUsers, 
  FiTag, 
  FiCheckSquare, 
  FiDatabase, 
  FiHelpCircle, 
  FiAlertCircle,
  FiX
} from 'react-icons/fi';

const Sidebar = ({ portalType, isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();
  
  // Generate navigation links based on portal type
  const navItems = 
    portalType === 'admin' 
      ? [
          { name: 'Dashboard', icon: <FiHome size={20} />, path: '/admin/dashboard' },
          { name: 'Dealers', icon: <FiUsers size={20} />, path: '/admin/dealers' },
          { name: 'Products', icon: <FiPackage size={20} />, path: '/admin/products' },
          { name: 'Users', icon: <FiUsers size={20} />, path: '/admin/users' },
          { name: 'Analytics', icon: <FiBarChart2 size={20} />, path: '/admin/analytics' },
          { name: 'Support', icon: <FiHelpCircle size={20} />, path: '/admin/support' },
          { name: 'Settings', icon: <FiSettings size={20} />, path: '/admin/settings' },
        ]
      : [
          { name: 'Dashboard', icon: <FiHome size={20} />, path: '/dealer/dashboard' },
          { name: 'Inventory', icon: <FiPackage size={20} />, path: '/dealer/inventory' },
          { name: 'Orders', icon: <FiShoppingCart size={20} />, path: '/dealer/orders' },
          { name: 'Analytics', icon: <FiBarChart2 size={20} />, path: '/dealer/analytics' },
          { name: 'Staff', icon: <FiUsers size={20} />, path: '/dealer/staff' },
          { name: 'Settings', icon: <FiSettings size={20} />, path: '/dealer/settings' },
        ];

  return (
    <div className="w-64 h-full bg-white border-r border-neutral-200 flex flex-col">
      {/* Mobile close button */}
      <div className="md:hidden px-4 pt-5 pb-2 flex justify-between items-center">
        <Logo size="small" />
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-700 focus:outline-none"
        >
          <FiX size={24} />
        </button>
      </div>
      
      {/* Desktop logo */}
      <div className="hidden md:flex px-6 pt-8 pb-6">
        <Logo size="medium" />
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
              onClick={onClose}
            >
              <span className={`mr-3 ${isActive ? 'text-primary-700' : 'text-neutral-500 group-hover:text-neutral-700'}`}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* Logout button */}
      <div className="px-4 py-4 border-t border-neutral-200">
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-neutral-700 rounded-md hover:bg-neutral-50"
        >
          <FiAlertCircle size={20} className="mr-3 text-neutral-500" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
