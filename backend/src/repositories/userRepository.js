const { getPool, sql } = require('../config/db');

// Mapping:
// - Table: dbo.Participants
// - UserID: PK
// - Email: username / login identifier
// - PasswordHash: password hash (bcrypt) - NEW COLUMN
// - CurrentAddress: actual current address
// - Nationality: role (PARTICIPANT / ADMIN) - NOTE: This is a workaround, real nationality should be in separate field

async function findByEmail(email) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Email', sql.NVarChar, email)
    .query(
      'SELECT UserID, FullName, BestRecord, Nationality, Sex, BirthYear, PassportNo, Email, Mobile, CurrentAddress, PasswordHash ' +
        'FROM dbo.Participants WHERE Email = @Email'
    );
  return result.recordset[0] || null;
}

async function findByPassportNo(passportNo) {
  if (!passportNo) return null;
  const pool = await getPool();
  const result = await pool
    .request()
    .input('PassportNo', sql.NVarChar, passportNo)
    .query(
      'SELECT UserID, FullName, Email, PassportNo FROM dbo.Participants WHERE PassportNo = @PassportNo'
    );
  return result.recordset[0] || null;
}

async function findByMobile(mobile) {
  if (!mobile) return null;
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Mobile', sql.NVarChar, mobile)
    .query(
      'SELECT UserID, FullName, Email, Mobile FROM dbo.Participants WHERE Mobile = @Mobile'
    );
  return result.recordset[0] || null;
}

async function findById(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserID', sql.Int, userId)
    .query(
      'SELECT UserID, FullName, BestRecord, Nationality, Sex, BirthYear, PassportNo, Email, Mobile, CurrentAddress, PasswordHash ' +
        'FROM dbo.Participants WHERE UserID = @UserID'
    );
  return result.recordset[0] || null;
}

async function createParticipant({ 
  fullName, 
  email, 
  passwordHash, 
  nationality, 
  sex, 
  birthYear, 
  passportNo, 
  mobile, 
  currentAddress 
}) {
  const pool = await getPool();
  const request = pool.request();

  request.input('FullName', sql.NVarChar, fullName);
  request.input('Email', sql.NVarChar, email);
  request.input('PasswordHash', sql.NVarChar, passwordHash);
  // Default role: PARTICIPANT (stored in Nationality field as workaround)
  request.input('Role', sql.NVarChar, 'PARTICIPANT');
  request.input('Nationality', sql.NVarChar, nationality);
  request.input('Sex', sql.NVarChar, sex);
  request.input('BirthYear', sql.Int, birthYear);
  request.input('PassportNo', sql.NVarChar, passportNo);
  request.input('Mobile', sql.NVarChar, mobile);
  request.input('CurrentAddress', sql.NVarChar, currentAddress);
  
  // Try to insert with PasswordHash column first, fallback to CurrentAddress if column doesn't exist
  let insertQuery;
  try {
    // Check if PasswordHash column exists
    const checkResult = await pool.request().query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Participants' 
      AND COLUMN_NAME = 'PasswordHash'
    `);
    const hasPasswordHashColumn = checkResult.recordset[0].count > 0;
    
    if (hasPasswordHashColumn) {
      // Use PasswordHash column (new schema)
      insertQuery = `
        INSERT INTO dbo.Participants (FullName, Email, PasswordHash, CurrentAddress, Nationality, Sex, BirthYear, PassportNo, Mobile)
        OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.Email, INSERTED.Nationality, INSERTED.CurrentAddress, INSERTED.Sex, INSERTED.BirthYear, INSERTED.PassportNo, INSERTED.Mobile
        VALUES (@FullName, @Email, @PasswordHash, @CurrentAddress, @Role, @Sex, @BirthYear, @PassportNo, @Mobile)
      `;
    } else {
      // Fallback: use CurrentAddress for password hash (old schema - backward compatibility)
      insertQuery = `
        INSERT INTO dbo.Participants (FullName, Email, CurrentAddress, Nationality, Sex, BirthYear, PassportNo, Mobile)
        OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.Email, INSERTED.Nationality, INSERTED.CurrentAddress, INSERTED.Sex, INSERTED.BirthYear, INSERTED.PassportNo, INSERTED.Mobile
        VALUES (@FullName, @Email, @PasswordHash, @Role, @Sex, @BirthYear, @PassportNo, @Mobile)
      `;
    }
  } catch (err) {
    // If check fails, use fallback
    insertQuery = `
      INSERT INTO dbo.Participants (FullName, Email, CurrentAddress, Nationality, Sex, BirthYear, PassportNo, Mobile)
      OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.Email, INSERTED.Nationality, INSERTED.CurrentAddress, INSERTED.Sex, INSERTED.BirthYear, INSERTED.PassportNo, INSERTED.Mobile
      VALUES (@FullName, @Email, @PasswordHash, @Role, @Sex, @BirthYear, @PassportNo, @Mobile)
    `;
  }

  const result = await request.query(insertQuery);
  return result.recordset[0];
}

async function updateProfile(userId, update) {
  const pool = await getPool();
  const fields = [];
  const request = pool.request();

  request.input('UserID', sql.Int, userId);

  if (update.FullName !== undefined) {
    fields.push('FullName = @FullName');
    request.input('FullName', sql.NVarChar, update.FullName);
  }
  if (update.BestRecord !== undefined) {
    fields.push('BestRecord = @BestRecord');
    request.input('BestRecord', sql.Time, update.BestRecord);
  }
  if (update.Nationality !== undefined) {
    fields.push('Nationality = @Nationality');
    request.input('Nationality', sql.NVarChar, update.Nationality);
  }
  if (update.Sex !== undefined) {
    fields.push('Sex = @Sex');
    request.input('Sex', sql.NVarChar, update.Sex);
  }
  if (update.BirthYear !== undefined) {
    fields.push('BirthYear = @BirthYear');
    request.input('BirthYear', sql.Int, update.BirthYear);
  }
  if (update.PassportNo !== undefined) {
    fields.push('PassportNo = @PassportNo');
    request.input('PassportNo', sql.NVarChar, update.PassportNo);
  }
  if (update.Email !== undefined) {
    fields.push('Email = @Email');
    request.input('Email', sql.NVarChar, update.Email);
  }
  if (update.Mobile !== undefined) {
    fields.push('Mobile = @Mobile');
    request.input('Mobile', sql.NVarChar, update.Mobile);
  }
  if (update.CurrentAddress !== undefined) {
    fields.push('CurrentAddress = @CurrentAddress');
    request.input('CurrentAddress', sql.NVarChar, update.CurrentAddress);
  }

  if (!fields.length) {
    return findById(userId);
  }

  const query = `
    UPDATE dbo.Participants
    SET ${fields.join(', ')}
    WHERE UserID = @UserID;

    SELECT UserID, FullName, BestRecord, Nationality, Sex, BirthYear, PassportNo, Email, Mobile, CurrentAddress, PasswordHash
    FROM dbo.Participants WHERE UserID = @UserID;
  `;

  const result = await request.query(query);
  return result.recordset[0];
}

async function createAdminIfNotExists({ fullName, email, passwordHash }) {
  const existing = await findByEmail(email);
  if (existing) {
    return existing;
  }

  const pool = await getPool();
  const request = pool.request();

  request.input('FullName', sql.NVarChar, fullName);
  request.input('Email', sql.NVarChar, email);
  request.input('PasswordHash', sql.NVarChar, passwordHash);
  request.input('Role', sql.NVarChar, 'ADMIN');

  // Check if PasswordHash column exists
  let insertQuery;
  try {
    const checkResult = await pool.request().query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Participants' 
      AND COLUMN_NAME = 'PasswordHash'
    `);
    const hasPasswordHashColumn = checkResult.recordset[0].count > 0;
    
    if (hasPasswordHashColumn) {
      insertQuery = `
        INSERT INTO dbo.Participants (FullName, Email, PasswordHash, Nationality)
        OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.Email, INSERTED.Nationality, INSERTED.PasswordHash
        VALUES (@FullName, @Email, @PasswordHash, @Role)
      `;
    } else {
      // Fallback: use CurrentAddress for password hash (old schema)
      insertQuery = `
        INSERT INTO dbo.Participants (FullName, Email, CurrentAddress, Nationality)
        OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.Email, INSERTED.Nationality, INSERTED.CurrentAddress
        VALUES (@FullName, @Email, @PasswordHash, @Role)
      `;
    }
  } catch (err) {
    // Fallback on error
    insertQuery = `
      INSERT INTO dbo.Participants (FullName, Email, CurrentAddress, Nationality)
      OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.Email, INSERTED.Nationality, INSERTED.CurrentAddress
      VALUES (@FullName, @Email, @PasswordHash, @Role)
    `;
  }

  const result = await request.query(insertQuery);
  return result.recordset[0];
}

async function updateParticipant(userId, update) {
  // Same as updateProfile, but for admin use
  return updateProfile(userId, update);
}

async function deleteParticipant(userId) {
  const pool = await getPool();
  const request = pool.request();
  request.input('UserID', sql.Int, userId);
  await request.query('DELETE FROM dbo.Participants WHERE UserID = @UserID');
}

module.exports = {
  findByEmail,
  findById,
  findByPassportNo,
  findByMobile,
  createParticipant,
  updateProfile,
  updateParticipant,
  deleteParticipant,
  createAdminIfNotExists,
};











