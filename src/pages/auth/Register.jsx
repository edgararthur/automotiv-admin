import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Register = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Get the user type from query params, default to buyer
  const defaultType = searchParams.get('type') || 'buyer';
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: defaultType,
    companyName: '',
    location: '',
    agreeTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    
    // Email validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Password validation
    if (!formData.password) {
      setError("Password is required");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (!formData.agreeTerms) {
      setError("You must agree to the terms and conditions");
      return;
    }
    
    // Additional validation for dealer registration
    if (formData.userType === 'dealer') {
      if (!formData.companyName.trim()) {
        setError("Company name is required for dealer registration");
        return;
      }
      
      if (!formData.location.trim()) {
        setError("Location is required for dealer registration");
        return;
      }
    }
    
    try {
      setError('');
      setIsLoading(true);
      
      const result = await register(formData, formData.userType);
      
      if (!result.success) {
        setError(result.error || 'Failed to create account');
      }
    } catch (err) {
      setError('Registration failed. Please try again later.');
      // In production, report this error to an error monitoring service
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Create your account</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in instead
          </Link>
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-error-50 text-error-700 rounded-md border border-error-200">
          {error}
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="userType" className="block text-sm font-medium text-neutral-700">
            I am registering as a
          </label>
          <select
            id="userType"
            name="userType"
            value={formData.userType}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            <option value="buyer">Buyer</option>
            <option value="dealer">Dealer</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
            {formData.userType === 'dealer' ? 'Contact Name' : 'Full Name'}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="John Smith"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="you@example.com"
          />
        </div>
        
        {formData.userType === 'dealer' && (
          <>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-neutral-700">
                Company Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Auto Parts Plus"
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-neutral-700">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                required
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Chicago, IL"
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
            Password
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="••••••••"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-400 hover:text-neutral-500 focus:outline-none"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Must be at least 6 characters
          </p>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
            Confirm Password
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="••••••••"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-neutral-400 hover:text-neutral-500 focus:outline-none"
              >
                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="agreeTerms"
            name="agreeTerms"
            type="checkbox"
            required
            checked={formData.agreeTerms}
            onChange={handleChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
          />
          <label htmlFor="agreeTerms" className="ml-2 block text-sm text-neutral-700">
            I agree to the{' '}
            <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
              Privacy Policy
            </Link>
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
            }`}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
