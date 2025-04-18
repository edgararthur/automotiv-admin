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

// Main function to fix profiles
async function fixProfile() {
  try {
    console.log('===== Profile Fix Utility =====');
    console.log('This tool will check and fix your user profile in the database.');
    
    const email = await prompt('Email of the admin account to fix: ');
    
    if (!email) {
      console.error('Error: Email is required.');
      process.exit(1);
    }
    
    console.log('\nChecking authentication status...');
    
    // Try to get user ID from authentication
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Could not access user list through admin API. Using alternative method.');
      // Try to sign in to get the user info
      const password = await prompt('Password (needed to verify account): ');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        throw new Error(`Authentication failed: ${signInError.message}`);
      }
      
      // Use signed in user data
      const userData = {
        id: signInData.user.id,
        email: signInData.user.email
      };
      
      console.log(`\n✅ Authentication succeeded. User ID: ${userData.id}`);
      
      // Check if profile exists
      console.log('\nChecking if profile exists...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .maybeSingle();
      
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      if (profileData) {
        console.log('\n✅ Profile exists! Updating role to ADMIN...');
        
        // Ensure role is ADMIN
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: 'ADMIN',
            updated_at: new Date()
          })
          .eq('id', userData.id)
          .select();
        
        if (updateError) {
          throw updateError;
        }
        
        console.log('\n✅ Profile updated successfully!');
      } else {
        console.log('\n⚠️ Profile does not exist. Creating new profile...');
        
        // Create the profile
        const name = await prompt('Full Name: ');
        const phone = await prompt('Phone Number: ');
        
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userData.id,
            email: userData.email,
            name: name || 'Admin User',
            phone: phone || '0000000000',
            role: 'ADMIN',
            created_at: new Date(),
            is_active: true
          })
          .select();
        
        if (insertError) {
          throw insertError;
        }
        
        console.log('\n✅ Profile created successfully!');
      }
      
      console.log('\nYou should now be able to log in to the admin platform.');
      return;
    }
    
    // If admin API works, find the user by email
    const user = authData.users.find(u => u.email === email);
    
    if (!user) {
      throw new Error(`No user found with email: ${email}`);
    }
    
    console.log(`\n✅ User found in authentication system. User ID: ${user.id}`);
    
    // Check if profile exists
    console.log('\nChecking if profile exists...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }
    
    if (profileData) {
      console.log('\n✅ Profile exists! Updating role to ADMIN...');
      
      // Ensure role is ADMIN
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'ADMIN',
          updated_at: new Date()
        })
        .eq('id', user.id)
        .select();
      
      if (updateError) {
        throw updateError;
      }
      
      console.log('\n✅ Profile updated successfully!');
    } else {
      console.log('\n⚠️ Profile does not exist. Creating new profile...');
      
      // Create the profile
      const name = await prompt('Full Name: ');
      const phone = await prompt('Phone Number: ');
      
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          name: name || 'Admin User',
          phone: phone || '0000000000',
          role: 'ADMIN',
          created_at: new Date(),
          is_active: true
        })
        .select();
      
      if (insertError) {
        throw insertError;
      }
      
      console.log('\n✅ Profile created successfully!');
    }
    
    console.log('\nYou should now be able to log in to the admin platform.');
    
  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error.message);
  } finally {
    rl.close();
  }
}

// Run the script
fixProfile(); 