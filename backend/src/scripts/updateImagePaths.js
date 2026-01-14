const { getPool, sql } = require('../config/db');

/**
 * Script to update image paths in PassingPoints table
 * Usage: node backend/src/scripts/updateImagePaths.js
 */

const imageMappings = {
  // Map PointName (partial match) to image filenames
  
  'Start Line': {
    photo: 'start-line-hoan-kiem-lake.jpg',
    thumbnail: 'start-line-hoan-kiem-lake.jpg' // Dùng chung ảnh
  },
  'Old Quarter': {
    photo: 'old-quarter-5km-mark.jpg',
    thumbnail: 'old-quarter-5km-mark.jpg'
  },
  'Long Bien': {
    photo: 'long-bien-bridge-10km-mark.jpg',
    thumbnail: 'long-bien-bridge-10km-mark.jpg'
  },
  'West Lake': {
    photo: 'west-lake-15km-mark.jpg',
    thumbnail: 'west-lake-15km-mark.jpg'
  },
  'Temple of Literature': {
    photo: 'temple-of-literature-20km-mark.jpg',
    thumbnail: 'temple-of-literature-20km-mark.jpg'
  },
  'Finish Line': {
    photo: 'finish-line-hoan-kiem-lake.jpg',
    thumbnail: 'finish-line-hoan-kiem-lake.jpg'
  }
};

async function updateImagePaths() {
  try {
    const pool = await getPool();
    
    console.log('🔄 Updating image paths...\n');

    for (const [key, paths] of Object.entries(imageMappings)) {
      const request = pool.request();
      
      const imagePath = `/images/passing-points/${paths.photo}`;
      request.input('PhotoPath', sql.NVarChar, imagePath);
      request.input('ThumbnailPath', sql.NVarChar, imagePath); 
      request.input('PointName', sql.NVarChar, `%${key}%`);

      const query = `
        UPDATE dbo.PassingPoints
        SET PhotoPath = @PhotoPath,
            ThumbnailPath = @ThumbnailPath
        WHERE PointName LIKE @PointName
      `;
      
     
      if (paths.photo === paths.thumbnail) {
        console.log(`   (Dùng chung ảnh cho thumbnail và full-size)`);
      }

      const result = await request.query(query);
      if (result.rowsAffected[0] > 0) {
        console.log(`✅ Updated: ${key}`);
        console.log(`   Photo: ${paths.photo}`);
        console.log(`   Thumbnail: ${paths.thumbnail}\n`);
      } else {
        console.log(`⚠️  Not found: ${key}\n`);
      }
    }

    console.log('✨ Done!');
    
  } catch (err) {
    console.error('❌ Error updating image paths:', err);
    throw err;
  }
}

// Run if called directly
if (require.main === module) {
  updateImagePaths()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed:', err);
      process.exit(1);
    });
}

module.exports = { updateImagePaths };

