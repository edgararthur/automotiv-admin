#!/bin/bash

# Log the current environment
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Check if shared directory exists
if [ ! -d "./shared" ]; then
  echo "Creating shared directory"
  mkdir -p shared
  
  # Copy necessary files
  echo "Setting up shared directory structure"
  mkdir -p shared/services shared/utils shared/supabase shared/components
  
  # Create minimal required files
  cat > shared/index.js << EOL
// Shared module exports
import * as UserService from './services/userService';
import * as ProductService from './services/productService';
import * as AnalyticsService from './services/analyticsService';
import supabase from './supabase/supabaseClient';

export {
  UserService,
  ProductService,
  AnalyticsService,
  supabase
};
EOL
  
  # Create userService.js
  cat > shared/services/userService.js << EOL
// User service
export const getAllUsers = async (filters = {}) => {
  // Mock implementation for build
  return { 
    success: true, 
    users: [], 
    pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } 
  };
};

export const setupAuthListener = () => {
  return { data: { subscription: { unsubscribe: () => {} } } };
};
EOL
  
  # Create productService.js
  cat > shared/services/productService.js << EOL
// Product service
export const getProducts = async () => {
  // Mock implementation for build
  return { success: true, products: [] };
};

export const getCategories = async () => {
  // Mock implementation for build
  return { success: true, categories: [] };
};

export const updateProductStatus = async (id, status) => {
  // Mock implementation for build
  return { success: true };
};
EOL
  
  # Create analyticsService.js
  cat > shared/services/analyticsService.js << EOL
// Analytics service
export const getPlatformAnalytics = async (options) => {
  // Mock implementation for build
  return { success: true, data: {} };
};
EOL
  
  # Create supabaseClient.js
  cat > shared/supabase/supabaseClient.js << EOL
// Supabase client
const supabase = {
  auth: {
    onAuthStateChange: () => ({ data: { subscription: {} } })
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) })
  })
};

export default supabase;
EOL
  
  # Create package.json for shared
  cat > shared/package.json << EOL
{
  "name": "autoplus-shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "index.js"
}
EOL
  
  echo "Shared directory setup complete"
else
  echo "Shared directory already exists"
fi

# Run the build command
echo "Running build command"
npm run build 