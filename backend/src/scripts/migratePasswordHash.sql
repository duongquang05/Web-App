
-- Step 1: Add PasswordHash column (if not exists)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Participants' 
    AND COLUMN_NAME = 'PasswordHash'
)
BEGIN
    ALTER TABLE dbo.Participants
    ADD PasswordHash NVARCHAR(255) NULL;
    
    PRINT '✓ PasswordHash column added successfully';
END
ELSE
BEGIN
    PRINT '✓ PasswordHash column already exists';
END
GO

-- Step 2: Migrate existing password hashes
-- Only migrate if CurrentAddress looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
UPDATE dbo.Participants
SET PasswordHash = CurrentAddress
WHERE (CurrentAddress LIKE '$2a$%' OR CurrentAddress LIKE '$2b$%' OR CurrentAddress LIKE '$2y$%')
  AND (PasswordHash IS NULL OR PasswordHash = '');

PRINT '✓ Migration completed. ' + CAST(@@ROWCOUNT AS VARCHAR) + ' password hash(es) migrated.';
GO

-- Step 3: Verify migration
SELECT 
    UserID,
    Email,
    CASE 
        WHEN PasswordHash IS NOT NULL THEN 'Has PasswordHash'
        ELSE 'No PasswordHash'
    END as PasswordStatus,
    CASE 
        WHEN CurrentAddress LIKE '$2%' THEN 'Address contains hash (needs cleanup)'
        ELSE 'Address is clean'
    END as AddressStatus
FROM dbo.Participants;
GO

PRINT '';
PRINT '========================================';
PRINT 'Migration Summary:';
PRINT '- PasswordHash column: Added';
PRINT '- Existing passwords: Migrated';
PRINT '- Next step: Restart backend server';
PRINT '========================================';


