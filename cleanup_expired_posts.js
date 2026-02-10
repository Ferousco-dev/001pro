#!/usr/bin/env node

// Script to cleanup expired posts with images
// Run with: node cleanup_expired_posts.js
// Or set up as a cron job: 0 * * * * node /path/to/cleanup_expired_posts.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create single Supabase client instance for cleanup operations
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupExpiredPosts() {
  try {
    console.log('🧹 Starting cleanup of expired posts...');

    // Get expired posts with images
    const { data: expiredPosts, error: fetchError } = await supabase
      .from('anonymous_posts')
      .select('id, media_urls')
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString())
      .not('media_urls', 'is', null);

    if (fetchError) {
      throw fetchError;
    }

    if (!expiredPosts || expiredPosts.length === 0) {
      console.log('✅ No expired posts to clean up');
      return;
    }

    console.log(`📋 Found ${expiredPosts.length} expired posts to clean up`);

    let deletedCount = 0;
    const deletedImages = [];

    // Process each expired post
    for (const post of expiredPosts) {
      console.log(`🗑️ Processing post ${post.id}`);

      if (post.media_urls && post.media_urls.length > 0) {
        // Extract filenames from URLs and delete from storage
        for (const imageUrl of post.media_urls) {
          try {
            // Extract filename from URL: https://xxx.supabase.co/storage/v1/object/public/images/filename.jpg
            const urlParts = imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];

            if (fileName) {
              console.log(`🖼️ Deleting image: ${fileName}`);

              const { error: storageError } = await supabase.storage
                .from('images')
                .remove([fileName]);

              if (storageError) {
                console.error(`❌ Failed to delete image ${fileName}:`, storageError.message);
              } else {
                deletedImages.push(fileName);
                console.log(`✅ Deleted image: ${fileName}`);
              }
            }
          } catch (imageError) {
            console.error(`❌ Error deleting image from ${imageUrl}:`, imageError.message);
          }
        }
      }

      // Delete the post
      const { error: deleteError } = await supabase
        .from('anonymous_posts')
        .delete()
        .eq('id', post.id);

      if (deleteError) {
        console.error(`❌ Failed to delete post ${post.id}:`, deleteError.message);
      } else {
        deletedCount++;
        console.log(`✅ Deleted post: ${post.id}`);
      }
    }

    console.log(`🎉 Cleanup complete!`);
    console.log(`📊 Summary:`);
    console.log(`   • Posts deleted: ${deletedCount}`);
    console.log(`   • Images deleted: ${deletedImages.length}`);
    console.log(`   • Total items cleaned: ${deletedCount + deletedImages.length}`);

  } catch (error) {
    console.error('💥 Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupExpiredPosts().then(() => {
  console.log('🏁 Cleanup script finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});