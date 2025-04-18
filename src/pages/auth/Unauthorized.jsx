import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Unauthorized = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Unauthorized Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You don't have permission to access the Admin Platform.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <div>
            <button
              onClick={handleLogout}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Log Out
            </button>
          </div>
          <div className="text-sm text-center">
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 