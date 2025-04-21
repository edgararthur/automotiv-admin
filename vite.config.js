import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from project root
  process.env = { ...process.env, ...loadEnv(mode, path.resolve(__dirname, '..'), '') };
  
  // First check if we have a local shared directory for deployment
  let sharedPath = path.resolve(__dirname, './shared');
  
  // If local shared doesn't exist, use the parent directory one (for local development)
  if (!fs.existsSync(sharedPath)) {
    sharedPath = path.resolve(__dirname, '../shared');
    
    // For Vercel deployment - if parent shared doesn't exist either, use src/shared
    if (!fs.existsSync(sharedPath)) {
      console.log('Shared directory not found at parent level, using src/shared instead');
      sharedPath = path.resolve(__dirname, './src/shared');
      
      // Create src/shared if it doesn't exist
      if (!fs.existsSync(sharedPath)) {
        try {
          fs.mkdirSync(sharedPath, { recursive: true });
          console.log('Created src/shared directory');
        } catch (err) {
          console.error('Failed to create src/shared directory:', err);
        }
      }
    }
  }
  
  console.log('Admin vite.config.js: Resolved shared path:', sharedPath);
  
  return {
    plugins: [react()],
    server: {
      port: 3003, // Different port for admin platform
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..']
      }
    },
    optimizeDeps: {
      include: ['autoplus-shared']
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'autoplus-shared': sharedPath,
        '../../../../shared': sharedPath  // Add direct alias for relative import
      },
    },
  };
}); 