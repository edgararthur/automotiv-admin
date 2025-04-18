import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Supabase credentials (copied from .env file)
const supabaseUrl = 'https://zlzzdycsizfwjkbulwgt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsenpkeWNzaXpmd2prYnVsd2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzI4OTQsImV4cCI6MjA2MDQ0ODg5NH0.vW5Nmy2Kh7yeI-Td41XKCdJo-n0BQxqQfGNEOcTyJRM';

// Initialize Supabase client
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

// Main function to create admin directly
async function createAdmin() {
  try {
    console.log('===== Create Admin Account (Direct Method) =====');
    console.log('This tool will create a new administrator account with immediate access.');
    
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
    
    console.log('\nCreating admin user with direct method...');
    
    // First, check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingUser) {
      throw new Error(`User with email ${email} already exists!`);
    }
    
    // Create user with admin API without email verification
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        name,
        phone,
        role: 'ADMIN'
      },
      app_metadata: {
        role: 'ADMIN'
      }
    });

    if (error) {
      throw error;
    }

    console.log('\nUser created in authentication system. Creating profile...');

    // Add user data to profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
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
    console.log(`ID: ${data.user.id}`);
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