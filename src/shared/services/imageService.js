import supabase from '../supabase/supabaseClient';

/**
 * Service for image handling and processing
 */
const ImageService = {
  /**
   * Upload an image to storage
   * @param {File} file - The image file to upload
   * @param {string} path - Storage path
   * @returns {Promise} - Upload result
   */
  uploadImage: async (file, path = 'images') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('autoplus-bucket')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('autoplus-bucket')
        .getPublicUrl(filePath);
      
      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default ImageService; 