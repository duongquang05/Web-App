const { getPool } = require('../config/db');

async function migratePasswordHash() {
  try {
    const pool = await getPool();
    const request = pool.request();

    console.log('Starting PasswordHash migration...');

    // Check if PasswordHash column exists
    const checkColumnQuery = `
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Participants' 
      AND COLUMN_NAME = 'PasswordHash'
    `;
    const checkResult = await request.query(checkColumnQuery);
    const columnExists = checkResult.recordset[0].count > 0;

    if (!columnExists) {
      console.log('Adding PasswordHash column...');
      await request.query(`
        ALTER TABLE dbo.Participants
        ADD PasswordHash NVARCHAR(255) NULL;
      `);
      console.log('✓ PasswordHash column added');
    } else {
      console.log('✓ PasswordHash column already exists');
    }

    // Migrate existing password hashes from CurrentAddress to PasswordHash
    // Only migrate if CurrentAddress looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
    console.log('Migrating existing password hashes...');
    const migrateResult = await request.query(`
      UPDATE dbo.Participants
      SET PasswordHash = CurrentAddress
      WHERE (CurrentAddress LIKE '$2a$%' OR CurrentAddress LIKE '$2b$%' OR CurrentAddress LIKE '$2y$%')
        AND (PasswordHash IS NULL OR PasswordHash = '');
      
      SELECT @@ROWCOUNT as migrated;
    `);
    const migrated = migrateResult.recordset[0].migrated;
    console.log(`✓ Migrated ${migrated} password hash(es)`);

    console.log('\nMigration completed successfully!');
    console.log('\nNote: Users with password hash in CurrentAddress have been migrated.');
    console.log('New registrations will use PasswordHash column, and CurrentAddress will store actual addresses.');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migratePasswordHash();


