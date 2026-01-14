-- Create PassingPoints table for Gallery feature
-- This table stores information about passing points along the marathon course

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.PassingPoints') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.PassingPoints (
        PointID INT IDENTITY(1,1) PRIMARY KEY,
        PointName NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX),
        DistanceFromStart DECIMAL(10,2), -- Distance in kilometers
        Location NVARCHAR(255), -- Location name/address
        PhotoPath NVARCHAR(500), -- Path to full-size photo
        ThumbnailPath NVARCHAR(500), -- Path to thumbnail photo
        DisplayOrder INT DEFAULT 0, -- Order for display in gallery
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );

    PRINT 'Table PassingPoints created successfully';
END
ELSE
BEGIN
    PRINT 'Table PassingPoints already exists';
END
GO

