import fs from 'fs';
import path from 'path';

const servicesDir = path.join(process.cwd(), 'services');

// Get all .js files in the services directory
const serviceFiles = fs.readdirSync(servicesDir).filter(file => file.endsWith('.js'));

serviceFiles.forEach(file => {
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace imports without .js extension
  content = content.replace(/from ['"]\.\.\/supabase\/supabaseClient['"];/g, 'from \'../supabase/supabaseClient.js\';');
  content = content.replace(/from ['"]\.\.\/utils\/errorLogger['"];/g, 'from \'../utils/errorLogger.js\';');
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content);
  console.log(`Fixed imports in ${file}`);
});

console.log('All imports fixed successfully!'); 