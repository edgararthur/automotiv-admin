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

// Main function to check email verification
async function verifyEmail() {
  try {
    console.log('===== Email Verification Helper =====');
    console.log('This tool will help verify your email if needed.');
    
    const email = await prompt('Email: ');
    
    if (!email) {
      console.error('Error: Email is required.');
      process.exit(1);
    }
    
    console.log('\nChecking email status...');
    
    // Check if the email exists in the profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();
    
    if (profileError) {
      throw profileError;
    }
    
    if (!profileData) {
      console.log(`\n⚠️ No user found with email: ${email}`);
      console.log('You may need to create an account first.');
      process.exit(0);
    }
    
    console.log('\n✅ User exists in the database.');
    console.log('Attempting to resend verification email...');
    
    // Resend verification email
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });

    if (resendError) {
      throw resendError;
    }

    console.log('\n✅ Verification email sent!');
    console.log('Please check your inbox (and spam folder) for the verification email.');
    console.log('After verifying your email, you should be able to log in to the platform.');
    
  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error.message);
  } finally {
    rl.close();
  }
}

// Run the script
verifyEmail(); 