-- Seed sample data for Hanoi Marathon system
-- Run in SQL Server (SSMS/Azure Data Studio) after schema is created
-- Adjust dates/paths as needed

USE HanoiMarathonDB;
GO

-- Participants (PasswordHash uses bcrypt, plain passwords noted below)
DECLARE @Participants TABLE (UserID INT, Email NVARCHAR(255));

INSERT INTO dbo.Participants (FullName, Email, PasswordHash, CurrentAddress, Nationality, Sex, BirthYear, PassportNo, Mobile)
OUTPUT inserted.UserID, inserted.Email INTO @Participants
VALUES
  ('System Admin', 'admin@example.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXe.Pp9vywgq6Z9erjR.u8aH/5pIvuX4G6', 'Hanoi', 'ADMIN', 'M', 1985, 'P-ADMIN-001', '+84-900-000-001'), -- password: password
  ('Nguyen Van A', 'user1@example.com', '$2b$10$KbQiFeoJEB6Digw1VE3D6u9Pqj8VimG5FxoL2vpzsh1KdrkK1DzIe', 'Hanoi', 'PARTICIPANT', 'M', 1992, 'P-USER-001', '+84-900-000-002'), -- password: Password123!
  ('Tran Thi B', 'user2@example.com', '$2b$10$KbQiFeoJEB6Digw1VE3D6u9Pqj8VimG5FxoL2vpzsh1KdrkK1DzIe', 'Da Nang', 'PARTICIPANT', 'F', 1995, 'P-USER-002', '+84-900-000-003'); -- password: Password123!

-- Marathons
DECLARE @Marathons TABLE (MarathonID INT, RaceName NVARCHAR(255));

INSERT INTO dbo.Marathons (RaceName, RaceDate, Status)
OUTPUT inserted.MarathonID, inserted.RaceName INTO @Marathons
VALUES
  ('Hanoi Spring Half', '2026-03-15', 'Active'),
  ('Hanoi Summer Night Run', '2026-06-20', 'Active'),
  ('Hanoi Heritage Full', '2025-11-02', 'Completed');

-- Map IDs for readability
DECLARE @adminId INT = (SELECT UserID FROM @Participants WHERE Email = 'admin@example.com');
DECLARE @user1Id INT = (SELECT UserID FROM @Participants WHERE Email = 'user1@example.com');
DECLARE @user2Id INT = (SELECT UserID FROM @Participants WHERE Email = 'user2@example.com');
DECLARE @springId INT = (SELECT MarathonID FROM @Marathons WHERE RaceName = 'Hanoi Spring Half');
DECLARE @summerId INT = (SELECT MarathonID FROM @Marathons WHERE RaceName = 'Hanoi Summer Night Run');
DECLARE @heritageId INT = (SELECT MarathonID FROM @Marathons WHERE RaceName = 'Hanoi Heritage Full');

-- Participations (EntryNumber > 0 = accepted; negative = pending)
INSERT INTO dbo.Participate (MarathonID, UserID, EntryNumber, Hotel, TimeRecord, Standings)
VALUES
  (@springId, @user1Id, 101, 'Hilton Hanoi Opera', NULL, NULL),             -- pending result
  (@springId, @user2Id, 102, 'Daewoo Hanoi', NULL, NULL),                    -- pending result
  (@heritageId, @user1Id, 21,  'Melia Hanoi', '03:45:20', 58),               -- finished
  (@heritageId, @user2Id, 345, 'Apricot Hotel', '04:12:05', 142),            -- finished
  (@summerId, @user1Id, -@user1Id, NULL, NULL, NULL);                        -- pending approval (negative EntryNumber)

-- Passing points (gallery) for a sample course
INSERT INTO dbo.PassingPoints (PointName, Description, DistanceFromStart, Location, PhotoPath, ThumbnailPath, DisplayOrder)
VALUES
  ('Start - Hoan Kiem Lake', 'Iconic lake start line', 0.00, 'Hoan Kiem', '/images/gallery/start.jpg', '/images/gallery/thumbs/start.jpg', 1),
  ('Long Bien Bridge', 'Historic iron bridge', 5.50, 'Long Bien', '/images/gallery/longbien.jpg', '/images/gallery/thumbs/longbien.jpg', 2),
  ('West Lake Loop', 'Scenic lakeside stretch', 12.30, 'Tay Ho', '/images/gallery/westlake.jpg', '/images/gallery/thumbs/westlake.jpg', 3),
  ('Lotte Observation', 'City view segment', 18.75, 'Ba Dinh', '/images/gallery/lotte.jpg', '/images/gallery/thumbs/lotte.jpg', 4),
  ('Finish - My Dinh Stadium', 'Finish arch', 21.10, 'My Dinh', '/images/gallery/finish.jpg', '/images/gallery/thumbs/finish.jpg', 5);

-- Safer printout without subqueries in string concatenation
DECLARE @cntParticipants INT = (SELECT COUNT(*) FROM @Participants);
DECLARE @cntMarathons INT = (SELECT COUNT(*) FROM @Marathons);
DECLARE @cntParticipate INT = (
  SELECT COUNT(*) FROM dbo.Participate WHERE MarathonID IN (SELECT MarathonID FROM @Marathons)
);
DECLARE @cntPassingPoints INT = (SELECT COUNT(*) FROM dbo.PassingPoints);

PRINT 'Seed data inserted:';
PRINT ' - Participants: ' + CAST(@cntParticipants AS VARCHAR(10));
PRINT ' - Marathons:    ' + CAST(@cntMarathons AS VARCHAR(10));
PRINT ' - Participate:  ' + CAST(@cntParticipate AS VARCHAR(10));
PRINT ' - PassingPoints: ' + CAST(@cntPassingPoints AS VARCHAR(10));
GO
