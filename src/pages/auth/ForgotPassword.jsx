import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { isValidEmail } from '../../utils/validation';
import { FiArrowLeft, FiMail } from 'react-icons/fi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      setError('');
      setIsLoading(true);
      
      // In a real app, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success state
      setSubmitted(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Reset your password</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-error-50 text-error-700 rounded-md border border-error-200">
          {error}
        </div>
      )}
      
      {submitted ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 text-success-600 mb-4">
            <FiMail className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Check your email</h3>
          <p className="text-neutral-600 mb-4">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-neutral-500 mb-6">
            If you don't see it, check your spam folder or make sure you entered the correct email.
          </p>
          <Link
            to="/auth/login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Return to login
          </Link>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              }`}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
          
          <div className="text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              <FiArrowLeft className="mr-1 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
