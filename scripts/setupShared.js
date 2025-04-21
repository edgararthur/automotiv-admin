import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sharedDir = path.join(rootDir, 'shared');

console.log('Setting up shared directory...');

// Create directories if they don't exist
const directories = [
  path.join(sharedDir, 'services'),
  path.join(sharedDir, 'supabase'),
  path.join(sharedDir, 'utils'),
  path.join(sharedDir, 'components')
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create index.js
const indexContent = `// Shared module exports
import supabase from './supabase/supabaseClient';

// Service imports
import UserService from './services/userService.js';
import ProductService from './services/productService.js';
import OrderService from './services/orderService.js';
import PaymentService from './services/paymentService.js';
import AnalyticsService from './services/analyticsService.js';
import DealerService from './services/dealerService.js';
import ImageService from './services/imageService.js';
import CartService from './services/cartService.js';

// Default exports
export {
  UserService,
  ProductService,
  OrderService,
  PaymentService,
  AnalyticsService,
  DealerService,
  ImageService,
  CartService,
  supabase
};

// Legacy exports for compatibility
export * from './services/userService.js';
export * from './services/productService.js';
export * from './services/orderService.js';
export * from './services/paymentService.js';
export * from './services/analyticsService.js';
export * from './services/dealerService.js';
export * from './services/imageService.js';
export * from './services/cartService.js';
`;

fs.writeFileSync(path.join(sharedDir, 'index.js'), indexContent);
console.log('Created index.js');

// Create supabaseClient.js
const supabaseContent = `import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables or fallback values
const supabaseUrl = 'https://zlzzdycsizfwjkbulwgt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsenpkeWNzaXpmd2prYnVsd2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzI4OTQsImV4cCI6MjA2MDQ0ODg5NH0.vW5Nmy2Kh7yeI-Td41XKCdJo-n0BQxqQfGNEOcTyJRM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };
export default supabase;
`;

fs.writeFileSync(path.join(sharedDir, 'supabase', 'supabaseClient.js'), supabaseContent);
console.log('Created supabaseClient.js');

// Create service files
const services = [
  {
    name: 'userService.js',
    content: `import supabase from '../supabase/supabaseClient.js';

/**
 * Service for user authentication and profile management
 */
const UserService = {
  getCurrentUser: async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return { success: false, error: sessionError?.message || 'No active session' };
      }
      
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (userError) {
        console.error('Error fetching user profile:', userError);
        return { 
          success: true, 
          user: {
            ...session.user,
            profile: null
          }
        };
      }
      
      return { 
        success: true, 
        user: {
          ...session.user,
          profile: user
        }
      };
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return { success: false, error: error.message };
    }
  },

  loginUser: async (email, password) => {
    return { success: true, user: {} };
  },
  
  logoutUser: async () => {
    return { success: true };
  },
  
  registerUser: async () => {
    return { success: true, user: {} };
  },
  
  resetPassword: async () => {
    return { success: true };
  },
  
  updateProfile: async () => {
    return { success: true, profile: {} };
  }
};

export default UserService;
export const getCurrentUser = UserService.getCurrentUser;
export const loginUser = UserService.loginUser;
export const logoutUser = UserService.logoutUser;
export const registerUser = UserService.registerUser;
export const resetPassword = UserService.resetPassword;
export const updateProfile = UserService.updateProfile;
`
  },
  {
    name: 'productService.js',
    content: `import supabase from '../supabase/supabaseClient.js';

/**
 * Service for managing products in the marketplace
 */
const ProductService = {
  getProducts: async () => {
    return { success: true, products: [] };
  },
  
  getCategories: async () => {
    return { success: true, categories: [] };
  },
  
  updateProductStatus: async () => {
    return { success: true, product: {} };
  }
};

export default ProductService;
export const getProducts = ProductService.getProducts;
export const getCategories = ProductService.getCategories;
export const updateProductStatus = ProductService.updateProductStatus;
`
  },
  {
    name: 'orderService.js',
    content: `import supabase from '../supabase/supabaseClient.js';

/**
 * Service for order management
 */
const OrderService = {
  getOrders: async () => {
    return { success: true, orders: [] };
  },
  
  updateOrderStatus: async () => {
    return { success: true };
  }
};

export default OrderService;
export const getOrders = OrderService.getOrders;
export const updateOrderStatus = OrderService.updateOrderStatus;
`
  },
  {
    name: 'paymentService.js',
    content: `import supabase from '../supabase/supabaseClient.js';

/**
 * Service for payment processing
 */
const PaymentService = {
  getPaymentDetails: async () => {
    return { success: true, payment: {} };
  }
};

export default PaymentService;
export const getPaymentDetails = PaymentService.getPaymentDetails;
`
  },
  {
    name: 'analyticsService.js',
    content: `import supabase from '../supabase/supabaseClient.js';

/**
 * Service for analytics and reporting
 */
const AnalyticsService = {
  getPlatformAnalytics: async () => {
    return { 
      success: true, 
      data: {
        totalUsers: 100,
        totalProducts: 500,
        totalOrders: 200
      } 
    };
  }
};

export default AnalyticsService;
export const getPlatformAnalytics = AnalyticsService.getPlatformAnalytics;
`
  },
  {
    name: 'dealerService.js',
    content: `import supabase from '../supabase/supabaseClient.js';

/**
 * Service for dealer management
 */
const DealerService = {
  getDealerDetails: async () => {
    return { success: true, dealer: {} };
  },
  
  updateDealerStatus: async () => {
    return { success: true };
  }
};

export default DealerService;
export const getDealerDetails = DealerService.getDealerDetails;
export const updateDealerStatus = DealerService.updateDealerStatus;
`
  },
  {
    name: 'imageService.js',
    content: `import supabase from '../supabase/supabaseClient.js';

/**
 * Service for image handling and processing
 */
const ImageService = {
  uploadImage: async () => {
    return { success: true, url: '' };
  }
};

export default ImageService;
export const uploadImage = ImageService.uploadImage;
`
  },
  {
    name: 'cartService.js',
    content: `import supabase from '../supabase/supabaseClient.js';

/**
 * Service for shopping cart management
 */
const CartService = {
  getCart: async () => {
    return { success: true, cart: {} };
  }
};

export default CartService;
export const getCart = CartService.getCart;
`
  }
];

services.forEach(service => {
  fs.writeFileSync(path.join(sharedDir, 'services', service.name), service.content);
  console.log(`Created ${service.name}`);
});

// Create package.json for shared
const packageJsonContent = `{
  "name": "autoplus-shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "index.js"
}`;

fs.writeFileSync(path.join(sharedDir, 'package.json'), packageJsonContent);
console.log('Created package.json for shared module');

console.log('Shared directory setup completed successfully.'); 