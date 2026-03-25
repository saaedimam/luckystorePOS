/**
 * Script to create the item-images storage bucket in Supabase
 * Run with: node scripts/create-storage-bucket.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env.local');
let supabaseUrl, supabaseServiceKey;

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
  }
} catch (err) {
  console.error('Could not read .env.local, using hardcoded values');
  supabaseUrl = 'https://hvmyxyccfnkrbxqbhlnm.supabase.co';
}

// Use service role key for admin operations
supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Make sure VITE_SUPABASE_URL exists in .env.local');
  console.error('   And export SUPABASE_SERVICE_ROLE_KEY in your shell before running this script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBucket() {
  console.log('🪣 Creating storage bucket: item-images');
  
  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return;
    }
    
    const existingBucket = buckets.find(b => b.name === 'item-images');
    
    if (existingBucket) {
      console.log('✅ Bucket "item-images" already exists');
      console.log(`   Public: ${existingBucket.public ? 'Yes' : 'No'}`);
      
      if (!existingBucket.public) {
        console.log('⚠️  Bucket is not public. Making it public...');
        // Note: Supabase JS client doesn't have a direct method to update bucket settings
        // You'll need to do this in the dashboard or use the REST API
        console.log('   Please set bucket to public in Supabase Dashboard:');
        console.log('   https://app.supabase.com/project/hvmyxyccfnkrbxqbhlnm/storage/buckets');
      }
      return;
    }
    
    // Create bucket
    const { data, error } = await supabase.storage.createBucket('item-images', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    });
    
    if (error) {
      console.error('❌ Error creating bucket:', error.message);
      console.log('\n💡 You may need to create it manually in the Supabase Dashboard:');
      console.log('   https://app.supabase.com/project/hvmyxyccfnkrbxqbhlnm/storage/buckets');
      console.log('   - Name: item-images');
      console.log('   - Public: Yes');
      return;
    }
    
    console.log('✅ Storage bucket "item-images" created successfully!');
    console.log('   Public: Yes');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.log('\n💡 Please create the bucket manually in Supabase Dashboard:');
    console.log('   https://app.supabase.com/project/hvmyxyccfnkrbxqbhlnm/storage/buckets');
  }
}

createStorageBucket();

