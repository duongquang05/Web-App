const { getPool, sql } = require('../config/db');
const fs = require('fs');
const path = require('path');

/**
 * Script to check gallery images setup
 * Usage: node backend/src/scripts/checkGalleryImages.js
 */

async function checkGalleryImages() {
  try {
    const pool = await getPool();
    
    console.log('🔍 Checking Gallery Images Setup...\n');
    
    // 1. Check database
    console.log('📊 Checking Database...');
    const dbResult = await pool.request().query(`
      SELECT PointID, PointName, PhotoPath, ThumbnailPath 
      FROM dbo.PassingPoints
      ORDER BY DisplayOrder, PointID
    `);
    
    if (dbResult.recordset.length === 0) {
      console.log('❌ No passing points found in database!');
      console.log('   Run: npm run create:gallery-table:seed\n');
      return;
    }
    
    console.log(`✅ Found ${dbResult.recordset.length} passing points in database\n`);
    
    // 2. Check file system
    console.log('📁 Checking File System...');
    const imagesPath = path.join(__dirname, '../../frontend/public/images/passing-points');
    const thumbnailsPath = path.join(__dirname, '../../frontend/public/images/passing-points/thumbnails');
    
    let imagesExist = false;
    let thumbnailsExist = false;
    
    if (fs.existsSync(imagesPath)) {
      const files = fs.readdirSync(imagesPath);
      const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
      console.log(`✅ Images folder exists: ${imagesPath}`);
      console.log(`   Found ${imageFiles.length} image files:`);
      imageFiles.forEach(file => {
        console.log(`   - ${file}`);
      });
      imagesExist = imageFiles.length > 0;
    } else {
      console.log(`❌ Images folder not found: ${imagesPath}`);
      console.log(`   Create this folder and add your images!`);
    }
    
    if (fs.existsSync(thumbnailsPath)) {
      const files = fs.readdirSync(thumbnailsPath);
      const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
      console.log(`✅ Thumbnails folder exists: ${thumbnailsPath}`);
      console.log(`   Found ${imageFiles.length} thumbnail files:`);
      imageFiles.forEach(file => {
        console.log(`   - ${file}`);
      });
      thumbnailsExist = imageFiles.length > 0;
    } else {
      console.log(`ℹ️  Thumbnails folder not found (optional): ${thumbnailsPath}`);
    }
    
    console.log('\n');
    
    // 3. Match database paths with files
    console.log('🔗 Matching Database Paths with Files...\n');
    
    for (const point of dbResult.recordset) {
      console.log(`📍 ${point.PointName}`);
      
      // Check PhotoPath
      if (point.PhotoPath) {
        const photoFileName = point.PhotoPath.split('/').pop();
        const photoFullPath = path.join(imagesPath, photoFileName);
        const photoExists = fs.existsSync(photoFullPath);
        
        if (photoExists) {
          console.log(`   ✅ Photo: ${photoFileName} - FOUND`);
        } else {
          console.log(`   ❌ Photo: ${photoFileName} - NOT FOUND`);
          console.log(`      Expected at: ${photoFullPath}`);
          console.log(`      Database path: ${point.PhotoPath}`);
        }
      } else {
        console.log(`   ⚠️  Photo: No path in database`);
      }
      
      // Check ThumbnailPath
      if (point.ThumbnailPath) {
        const thumbFileName = point.ThumbnailPath.split('/').pop();
        // Check both thumbnails folder and main folder
        const thumbFullPath1 = path.join(thumbnailsPath, thumbFileName);
        const thumbFullPath2 = path.join(imagesPath, thumbFileName);
        const thumbExists = fs.existsSync(thumbFullPath1) || fs.existsSync(thumbFullPath2);
        
        if (thumbExists) {
          console.log(`   ✅ Thumbnail: ${thumbFileName} - FOUND`);
        } else {
          console.log(`   ⚠️  Thumbnail: ${thumbFileName} - NOT FOUND (will use photo instead)`);
        }
      } else {
        console.log(`   ℹ️  Thumbnail: Will use photo path`);
      }
      
      console.log('');
    }
    
    // 4. Summary
    console.log('📋 Summary:');
    console.log(`   - Database records: ${dbResult.recordset.length}`);
    console.log(`   - Images in folder: ${imagesExist ? 'YES' : 'NO'}`);
    console.log(`   - Thumbnails in folder: ${thumbnailsExist ? 'YES' : 'NO (optional)'}`);
    
    if (!imagesExist) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('   1. Copy your images to: frontend/public/images/passing-points/');
      console.log('   2. Run: npm run update:gallery-images');
      console.log('   3. Refresh browser');
    } else {
      console.log('\n✅ Setup looks good! If images still not showing:');
      console.log('   1. Check browser console (F12) for errors');
      console.log('   2. Try hard refresh (Ctrl+F5)');
      console.log('   3. Check if frontend server is running');
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
    throw err;
  }
}

// Run if called directly
if (require.main === module) {
  checkGalleryImages()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed:', err);
      process.exit(1);
    });
}

module.exports = { checkGalleryImages };

