import React from 'react';
import { useEffect, useState } from 'react';

/**
 * TestShared component for testing shared libraries and components
 * This is a utility component used for development and testing
 */
const TestShared = () => {
  const [testStatus, setTestStatus] = useState('Ready');

  useEffect(() => {
    // Test shared libraries loading
    const testSharedLibraries = async () => {
      try {
        setTestStatus('Testing shared components...');
        // Add actual tests here when needed
        
        setTestStatus('All shared libraries loaded successfully');
      } catch (error) {
        console.error('Error testing shared libraries:', error);
        setTestStatus(`Error: ${error.message}`);
      }
    };

    testSharedLibraries();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Shared Components/Services Test Page</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Status</h2>
        <div className={`p-4 rounded-md ${
          testStatus.includes('Error') 
            ? 'bg-red-100 text-red-700' 
            : testStatus.includes('successfully')
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
        }`}>
          {testStatus}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Test Components</h2>
        <div className="space-y-4">
          {/* Add test components here as needed */}
          <p className="text-gray-500">This is a testing area for shared components and services.</p>
        </div>
      </div>
    </div>
  );
};

export default TestShared; 