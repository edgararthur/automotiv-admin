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
        'autoplus-shared': sharedPath
      },
    },
  };
}); 