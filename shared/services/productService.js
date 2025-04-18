import supabase from '../supabase/supabaseClient.js';

/**
 * Service for managing products in the marketplace
 */
const ProductService = {
  /**
   * Get all products with optional filters
   * @param {Object} filters - Optional filters for products
   * @returns {Promise} - Products
   */
  getProducts: async (filters = {}) => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          dealer:dealer_id(id, name, company_name, location),
          category:category_id(id, name),
          subcategory:subcategory_id(id, name),
          product_images(id, url)
        `);

      // Apply filters if provided
      if (filters.dealerId) {
        query = query.eq('dealer_id', filters.dealerId);
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.subcategoryId) {
        query = query.eq('subcategory_id', filters.subcategoryId);
      }

      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }

      if (filters.minPrice && filters.maxPrice) {
        query = query.gte('price', filters.minPrice).lte('price', filters.maxPrice);
      } else if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      } else if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%,part_number.ilike.%${filters.searchTerm}%`);
      }

      // Apply sorting
      if (filters.sortBy) {
        const order = filters.sortOrder === 'desc' ? 'desc' : 'asc';
        query = query.order(filters.sortBy, { ascending: order === 'asc' });
      } else {
        // Default sort by created_at (newest first)
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        products: data || [],
        count
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get a single product by ID
   * @param {string} productId - Product ID
   * @returns {Promise} - Product details
   */
  getProductById: async (productId) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          dealer:dealer_id(id, name, company_name, location),
          category:category_id(id, name),
          subcategory:subcategory_id(id, name),
          product_images(id, url),
          reviews(id, rating, comment, created_at, user_id, user:user_id(name))
        `)
        .eq('id', productId)
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        product: data
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Add a new product
   * @param {Object} productData - Product data to add
   * @returns {Promise} - Result of the operation
   */
  addProduct: async (productData) => {
    try {
      // Validate required fields
      if (!productData.name || !productData.dealer_id || !productData.price || !productData.category_id) {
        throw new Error('Missing required product information');
      }

      // Extract images from product data to insert separately
      const { images, ...productDataWithoutImages } = productData;

      // Add created_at timestamp
      productDataWithoutImages.created_at = new Date();

      // Set moderation status to pending for new products
      productDataWithoutImages.moderation_status = 'PENDING';

      // Insert product data
      const { data, error } = await supabase
        .from('products')
        .insert(productDataWithoutImages)
        .select();

      if (error) {
        throw error;
      }

      const productId = data[0].id;

      // If there are images, upload them
      if (images && images.length > 0) {
        const imagePromises = images.map(async (image, index) => {
          // For demonstration, we're assuming images are already URLs
          // In a real implementation, you would handle file uploads to Supabase storage
          const { data: imageData, error: imageError } = await supabase
            .from('product_images')
            .insert({
              product_id: productId,
              url: image.url || image,
              is_primary: index === 0, // First image is primary
              created_at: new Date()
            });

          if (imageError) {
            throw imageError;
          }

          return imageData;
        });

        await Promise.all(imagePromises);
      }

      return {
        success: true,
        productId,
        message: 'Product successfully added and pending moderation'
      };
    } catch (error) {
      console.error('Error adding product:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Update an existing product
   * @param {string} productId - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise} - Result of the operation
   */
  updateProduct: async (productId, productData) => {
    try {
      // Extract images to handle separately
      const { images, ...productDataWithoutImages } = productData;

      // Add updated_at timestamp
      productDataWithoutImages.updated_at = new Date();
      
      // For significant changes, we might want to set moderation status back to pending
      // This depends on business rules - for now, let's assume updates require moderation
      productDataWithoutImages.moderation_status = 'PENDING';

      // Update the product
      const { data, error } = await supabase
        .from('products')
        .update(productDataWithoutImages)
        .eq('id', productId)
        .select();

      if (error) {
        throw error;
      }

      // Handle image updates if provided
      if (images && images.length > 0) {
        // First, get existing images
        const { data: existingImages, error: fetchError } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId);

        if (fetchError) {
          throw fetchError;
        }

        // For simplicity, we'll delete all existing images and add new ones
        // In a real app, you might want a more sophisticated approach
        if (existingImages.length > 0) {
          const { error: deleteError } = await supabase
            .from('product_images')
            .delete()
            .eq('product_id', productId);

          if (deleteError) {
            throw deleteError;
          }
        }

        // Add new images
        const imagePromises = images.map(async (image, index) => {
          const { data: imageData, error: imageError } = await supabase
            .from('product_images')
            .insert({
              product_id: productId,
              url: image.url || image,
              is_primary: index === 0,
              created_at: new Date()
            });

          if (imageError) {
            throw imageError;
          }

          return imageData;
        });

        await Promise.all(imagePromises);
      }

      return {
        success: true,
        productId,
        message: 'Product successfully updated and pending moderation'
      };
    } catch (error) {
      console.error('Error updating product:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Delete a product
   * @param {string} productId - Product ID
   * @returns {Promise} - Result of the operation
   */
  deleteProduct: async (productId) => {
    try {
      // First, delete related images
      const { error: imageDeleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      if (imageDeleteError) {
        throw imageDeleteError;
      }

      // Delete reviews
      const { error: reviewDeleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('product_id', productId);

      if (reviewDeleteError) {
        throw reviewDeleteError;
      }

      // Finally, delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Product successfully deleted'
      };
    } catch (error) {
      console.error('Error deleting product:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get categories and subcategories
   * @returns {Promise} - Categories with subcategories
   */
  getCategories: async () => {
    try {
      // First, get all categories
      const { data: categories, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoryError) {
        throw categoryError;
      }

      // Then get all subcategories
      const { data: subcategories, error: subcategoryError } = await supabase
        .from('subcategories')
        .select('*')
        .order('name');

      if (subcategoryError) {
        throw subcategoryError;
      }

      // Organize subcategories by their parent category
      const result = categories.map(category => {
        const categorySubcategories = subcategories.filter(
          subcategory => subcategory.category_id === category.id
        );
        
        return {
          ...category,
          subcategories: categorySubcategories
        };
      });

      return {
        success: true,
        categories: result
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default ProductService; 