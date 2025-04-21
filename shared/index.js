// Import all the services directly
import supabaseClient from './supabase/supabaseClient.js';
import PaymentServiceDefault from './services/paymentService.js';
import ProductServiceDefault from './services/productService.js';
import OrderServiceDefault from './services/orderService.js';
import CartServiceDefault from './services/cartService.js';
import UserServiceDefault from './services/userService.js';
import DealerServiceDefault from './services/dealerService.js';
import WarrantyServiceDefault from './services/warrantyService.js';
import AnalyticsServiceDefault from './services/analyticsService.js';

// Re-export everything with explicit names
export const supabase = supabaseClient;
export const PaymentService = PaymentServiceDefault;
export const ProductService = ProductServiceDefault;
export const OrderService = OrderServiceDefault;
export const CartService = CartServiceDefault;
export const UserService = UserServiceDefault;
export const DealerService = DealerServiceDefault;
export const WarrantyService = WarrantyServiceDefault;
export const AnalyticsService = AnalyticsServiceDefault; 