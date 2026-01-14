const { getPool, sql } = require('../config/db');

async function getAllPassingPoints() {
  const pool = await getPool();
  const query = `
    SELECT 
      PointID,
      PointName,
      Description,
      DistanceFromStart,
      Location,
      PhotoPath,
      ThumbnailPath,
      DisplayOrder
    FROM dbo.PassingPoints
    ORDER BY DisplayOrder, PointID
  `;
  const result = await pool.request().query(query);
  return result.recordset;
}

async function getPassingPointById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('PointID', sql.Int, id)
    .query(`
      SELECT 
        PointID,
        PointName,
        Description,
        DistanceFromStart,
        Location,
        PhotoPath,
        ThumbnailPath,
        DisplayOrder
      FROM dbo.PassingPoints
      WHERE PointID = @PointID
    `);
  return result.recordset[0] || null;
}

async function createPassingPoint({ pointName, description, distanceFromStart, location, photoPath, thumbnailPath, displayOrder }) {
  const pool = await getPool();
  const request = pool.request();
  request.input('PointName', sql.NVarChar, pointName);
  request.input('Description', sql.NVarChar, description || null);
  request.input('DistanceFromStart', sql.Decimal(10, 2), distanceFromStart || null);
  request.input('Location', sql.NVarChar, location || null);
  request.input('PhotoPath', sql.NVarChar, photoPath || null);
  request.input('ThumbnailPath', sql.NVarChar, thumbnailPath || null);
  request.input('DisplayOrder', sql.Int, displayOrder || 0);

  const query = `
    INSERT INTO dbo.PassingPoints (PointName, Description, DistanceFromStart, Location, PhotoPath, ThumbnailPath, DisplayOrder)
    OUTPUT INSERTED.PointID, INSERTED.PointName, INSERTED.Description, INSERTED.DistanceFromStart, 
           INSERTED.Location, INSERTED.PhotoPath, INSERTED.ThumbnailPath, INSERTED.DisplayOrder
    VALUES (@PointName, @Description, @DistanceFromStart, @Location, @PhotoPath, @ThumbnailPath, @DisplayOrder)
  `;
  const result = await request.query(query);
  return result.recordset[0];
}

async function updatePassingPoint(id, { pointName, description, distanceFromStart, location, photoPath, thumbnailPath, displayOrder }) {
  const pool = await getPool();
  const request = pool.request();
  request.input('PointID', sql.Int, id);
  
  const updates = [];
  if (pointName !== undefined) {
    request.input('PointName', sql.NVarChar, pointName);
    updates.push('PointName = @PointName');
  }
  if (description !== undefined) {
    request.input('Description', sql.NVarChar, description);
    updates.push('Description = @Description');
  }
  if (distanceFromStart !== undefined) {
    request.input('DistanceFromStart', sql.Decimal(10, 2), distanceFromStart);
    updates.push('DistanceFromStart = @DistanceFromStart');
  }
  if (location !== undefined) {
    request.input('Location', sql.NVarChar, location);
    updates.push('Location = @Location');
  }
  if (photoPath !== undefined) {
    request.input('PhotoPath', sql.NVarChar, photoPath);
    updates.push('PhotoPath = @PhotoPath');
  }
  if (thumbnailPath !== undefined) {
    request.input('ThumbnailPath', sql.NVarChar, thumbnailPath);
    updates.push('ThumbnailPath = @ThumbnailPath');
  }
  if (displayOrder !== undefined) {
    request.input('DisplayOrder', sql.Int, displayOrder);
    updates.push('DisplayOrder = @DisplayOrder');
  }

  if (updates.length === 0) return getPassingPointById(id);

  updates.push('UpdatedAt = GETDATE()');
  const query = `
    UPDATE dbo.PassingPoints
    SET ${updates.join(', ')}
    WHERE PointID = @PointID;

    SELECT PointID, PointName, Description, DistanceFromStart, Location, PhotoPath, ThumbnailPath, DisplayOrder
    FROM dbo.PassingPoints
    WHERE PointID = @PointID
  `;
  const result = await request.query(query);
  return result.recordset[0];
}

async function deletePassingPoint(id) {
  const pool = await getPool();
  const request = pool.request();
  request.input('PointID', sql.Int, id);
  await request.query('DELETE FROM dbo.PassingPoints WHERE PointID = @PointID');
}

module.exports = {
  getAllPassingPoints,
  getPassingPointById,
  createPassingPoint,
  updatePassingPoint,
  deletePassingPoint,
};

