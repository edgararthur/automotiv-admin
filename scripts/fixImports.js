import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Fixing problematic imports...');

const searchForProblematicImports = (dir) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively search directories, but skip node_modules
      if (file !== 'node_modules') {
        searchForProblematicImports(filePath);
      }
    } else if (/\.(jsx?|tsx?)$/.test(file)) {
      // Only check JavaScript and TypeScript files
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if file has problematic imports
        if (content.includes('from "../../../../shared"') || 
            content.includes('from \'../../../../shared\'')) {
          console.log(`Found problematic import in: ${filePath}`);
          
          // Fix the imports
          const fixedContent = content
            .replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/shared['"]/g, 'from "autoplus-shared"');
          
          fs.writeFileSync(filePath, fixedContent, 'utf8');
          console.log(`  - Fixed import in ${filePath}`);
        }
      } catch (err) {
        console.error(`Error processing file ${filePath}:`, err);
      }
    }
  });
};

// Start the search from src directory
searchForProblematicImports(path.join(rootDir, 'src'));
console.log('Import fixing completed'); 