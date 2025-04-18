import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMenu, 
  FiBell, 
  FiSearch, 
  FiHelpCircle, 
  FiMessageSquare,
  FiChevronDown
} from 'react-icons/fi';
import Avatar from '../common/Avatar';

const Header = ({ portalType, toggleSidebar, user }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const portalName = portalType === 'admin' ? 'Admin Portal' : 'Dealer Portal';
  
  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <FiMenu className="h-6 w-6" />
            </button>
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-neutral-900">{portalName}</h1>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="hidden md:block mx-4 flex-1 max-w-xs">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md leading-5 bg-neutral-50 placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search..."
              />
            </div>
          </div>
          
          {/* Header actions */}
          <div className="flex items-center space-x-4">
            {/* Help */}
            <button className="text-neutral-500 hover:text-neutral-700">
              <FiHelpCircle className="h-5 w-5" />
            </button>
            
            {/* Messages */}
            <button className="text-neutral-500 hover:text-neutral-700 relative">
              <FiMessageSquare className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-error-500 transform -translate-y-1/2 translate-x-1/2"></span>
            </button>
            
            {/* Notifications dropdown */}
            <div className="relative">
              <button 
                className="text-neutral-500 hover:text-neutral-700 relative"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <FiBell className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-error-500 transform -translate-y-1/2 translate-x-1/2"></span>
              </button>
              
              {notificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-2 border-b border-neutral-100">
                    <div className="px-4 py-2 flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-900">Notifications</span>
                      <button className="text-xs text-primary-600 hover:text-primary-700">
                        Mark all as read
                      </button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                      <p className="text-sm font-medium text-neutral-900">New order received</p>
                      <p className="text-xs text-neutral-500 mt-1">Order #12345 requires processing</p>
                      <p className="text-xs text-neutral-400 mt-1">10 minutes ago</p>
                    </div>
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="text-sm font-medium text-neutral-900">Inventory alert</p>
                      <p className="text-xs text-neutral-500 mt-1">5 products are low in stock</p>
                      <p className="text-xs text-neutral-400 mt-1">1 hour ago</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium text-neutral-900">Payment received</p>
                      <p className="text-xs text-neutral-500 mt-1">Payment for order #12344 received</p>
                      <p className="text-xs text-neutral-400 mt-1">Yesterday</p>
                    </div>
                  </div>
                  <div className="py-2 border-t border-neutral-100 text-center">
                    <Link to={`/${portalType}/notifications`} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* User dropdown */}
            <div className="relative">
              <button
                className="flex items-center space-x-2"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <Avatar name={user?.name || 'User'} size="small" />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-neutral-800">{user?.name}</div>
                  <div className="text-xs text-neutral-500">{user?.email}</div>
                </div>
                <FiChevronDown className="h-4 w-4 text-neutral-500" />
              </button>
              
              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <Link 
                    to={`/${portalType}/settings`}
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <Link 
                    to={`/${portalType}/settings`}
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    className="w-full text-left block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    onClick={() => {
                      setUserMenuOpen(false);
                      // Add logout logic here
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
