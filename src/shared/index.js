// Export all shared services and utilities
import UserService from './services/userService';
import ProductService from './services/productService';
import OrderService from './services/orderService';
import PaymentService from './services/paymentService';
import AnalyticsService from './services/analyticsService';
import DealerService from './services/dealerService';
import ImageService from './services/imageService';
import supabase from './supabase/supabaseClient';

// Export default objects
export {
  UserService,
  ProductService,
  OrderService,
  PaymentService,
  AnalyticsService,
  DealerService,
  ImageService,
  supabase
};

// For compatibility with existing imports
export default {
  UserService,
  ProductService,
  OrderService,
  PaymentService,
  AnalyticsService,
  DealerService,
  ImageService,
  supabase
}; 