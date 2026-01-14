const { getPool } = require('../config/db');

async function createPassingPointsTable() {
  try {
    const pool = await getPool();
    
    // Check if table exists
    const checkTableQuery = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'PassingPoints'
    `;
    const tableExists = await pool.request().query(checkTableQuery);
    
    if (tableExists.recordset.length > 0) {
      console.log('✅ Table PassingPoints already exists');
      return;
    }

    // Create table
    const createTableQuery = `
      CREATE TABLE dbo.PassingPoints (
        PointID INT IDENTITY(1,1) PRIMARY KEY,
        PointName NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX),
        DistanceFromStart DECIMAL(10,2),
        Location NVARCHAR(255),
        PhotoPath NVARCHAR(500),
        ThumbnailPath NVARCHAR(500),
        DisplayOrder INT DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
      );
    `;

    await pool.request().query(createTableQuery);
    console.log('✅ Table PassingPoints created successfully!');
    
    // Optionally seed sample data
    const seedData = process.argv.includes('--seed');
    if (seedData) {
      await seedSampleData(pool);
    }
    
  } catch (err) {
    console.error('❌ Error creating table:', err);
    throw err;
  }
}

async function seedSampleData(pool) {
  try {
    // Check if data already exists
    const checkData = await pool.request().query('SELECT COUNT(*) as count FROM dbo.PassingPoints');
    if (checkData.recordset[0].count > 0) {
      console.log('ℹ️  Sample data already exists, skipping seed...');
      return;
    }

    const insertQuery = `
      INSERT INTO dbo.PassingPoints (PointName, Description, DistanceFromStart, Location, PhotoPath, ThumbnailPath, DisplayOrder)
      VALUES
      ('Start Line - Hoan Kiem Lake', 
       'The race begins at the iconic Hoan Kiem Lake, the heart of Hanoi. Runners will start their journey surrounded by the beautiful lake and historic architecture.',
       0.00, 
       'Hoan Kiem District, Hanoi',
       '/images/passing-points/start-line.jpg',
       '/images/passing-points/thumbnails/start-line-thumb.jpg',
       1),
      ('Old Quarter - 5km Mark', 
       'Passing through the historic Old Quarter, runners will experience the charm of Hanoi''s ancient streets, traditional architecture, and vibrant local life.',
       5.00,
       'Old Quarter, Hoan Kiem District',
       '/images/passing-points/old-quarter.jpg',
       '/images/passing-points/thumbnails/old-quarter-thumb.jpg',
       2),
      ('Long Bien Bridge - 10km Mark', 
       'Crossing the historic Long Bien Bridge, a symbol of Hanoi''s resilience. This French colonial bridge offers stunning views of the Red River.',
       10.00,
       'Long Bien Bridge, Hanoi',
       '/images/passing-points/long-bien-bridge.jpg',
       '/images/passing-points/thumbnails/long-bien-bridge-thumb.jpg',
       3),
      ('West Lake - 15km Mark', 
       'Running along West Lake, the largest lake in Hanoi. Enjoy the peaceful atmosphere and beautiful scenery of this popular recreational area.',
       15.00,
       'West Lake, Tay Ho District',
       '/images/passing-points/west-lake.jpg',
       '/images/passing-points/thumbnails/west-lake-thumb.jpg',
       4),
      ('Temple of Literature - 20km Mark', 
       'Passing by the Temple of Literature, Vietnam''s first university. This historic site represents the country''s dedication to education and learning.',
       20.00,
       'Temple of Literature, Dong Da District',
       '/images/passing-points/temple-of-literature.jpg',
       '/images/passing-points/thumbnails/temple-of-literature-thumb.jpg',
       5),
      ('Finish Line - Hoan Kiem Lake', 
       'Returning to Hoan Kiem Lake for the finish. Celebrate your achievement at the same beautiful location where you started your marathon journey.',
       42.195,
       'Hoan Kiem District, Hanoi',
       '/images/passing-points/finish-line.jpg',
       '/images/passing-points/thumbnails/finish-line-thumb.jpg',
       6);
    `;

    await pool.request().query(insertQuery);
    console.log('✅ Sample data seeded successfully! (6 passing points)');
  } catch (err) {
    console.error('❌ Error seeding data:', err);
    throw err;
  }
}

// Run if called directly
if (require.main === module) {
  createPassingPointsTable()
    .then(() => {
      console.log('✨ Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed:', err);
      process.exit(1);
    });
}

module.exports = { createPassingPointsTable, seedSampleData };

