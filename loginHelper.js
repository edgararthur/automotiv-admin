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

// Main function to test login
async function testLogin() {
  try {
    console.log('===== Login Test Utility =====');
    console.log('This tool will test your login credentials directly with Supabase.');
    
    const email = await prompt('Email: ');
    const password = await prompt('Password: ');
    
    if (!email || !password) {
      console.error('Error: Both email and password are required.');
      process.exit(1);
    }
    
    console.log('\nAttempting to login...');
    
    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    console.log('\n✅ Successfully logged in!');
    console.log(`User ID: ${data.user.id}`);
    console.log(`Email: ${data.user.email}`);
    
    // Check the user's role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();
      
    if (profileError) {
      console.log('\n⚠️ Logged in successfully, but could not fetch user profile.');
      console.log(`Error: ${profileError.message}`);
    } else {
      console.log(`Role: ${profileData.role}`);
      
      if (profileData.role !== 'ADMIN') {
        console.log('\n⚠️ User logged in successfully but does not have ADMIN role.');
        console.log('This may cause issues when accessing admin-only pages.');
      }
    }
    
    console.log('\nYou should now be able to log in to the admin platform.');
    
  } catch (error) {
    console.error('\n❌ Login failed:');
    console.error(error.message);
    console.log('\nPossible solutions:');
    console.log('1. Check if you typed the email and password correctly');
    console.log('2. Check if you verified your email (check your inbox)');
    console.log('3. Try creating a new admin account');
  } finally {
    rl.close();
  }
}

// Run the script
testLogin(); 