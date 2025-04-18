import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and key must be provided in environment variables.');
  console.error('Please create a .env file with SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create interface for command line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
const prompt = (question) => new Promise((resolve) => {
  rl.question(question, (answer) => resolve(answer));
});

// Main function to create admin
async function createAdmin() {
  try {
    console.log('===== Create Admin Account =====');
    console.log('This tool will create a new administrator account.');
    
    const name = await prompt('Full Name: ');
    const email = await prompt('Email: ');
    const password = await prompt('Password (min 6 characters): ');
    const phone = await prompt('Phone Number: ');
    
    if (!name || !email || !password || !phone) {
      console.error('Error: All fields are required.');
      process.exit(1);
    }
    
    if (password.length < 6) {
      console.error('Error: Password must be at least 6 characters.');
      process.exit(1);
    }
    
    console.log('\nCreating admin user...');
    
    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          role: 'ADMIN'
        }
      }
    });

    if (authError) {
      throw authError;
    }

    // Add additional user data to profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name,
        email,
        phone,
        role: 'ADMIN',
        created_at: new Date(),
        is_active: true
      });

    if (profileError) {
      throw profileError;
    }

    console.log('\n✅ Admin user created successfully!');
    console.log(`ID: ${authData.user.id}`);
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log('\nYou can now log in to the admin platform with these credentials.');
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error(error.message);
  } finally {
    rl.close();
  }
}

// Run the script
createAdmin(); 