const sql = require("mssql");
require("dotenv").config();

// Prefer full connection string if provided (works with "DESKTOP-MIIKK0E\\SQLEXPRESS" etc.)
// Example: DB_CONNECTION_STRING=Data Source=DESKTOP-MIIKK0E\SQLEXPRESS;Initial Catalog=HanoiMarathonDB;User ID=sa;Password=your_password;Trust Server Certificate=True
const connectionString = process.env.DB_CONNECTION_STRING;

const dbConfig = connectionString
  ? {
      connectionString,
      options: {
        trustServerCertificate: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    }
  : {
      server: process.env.DB_SERVER || "localhost",
      database: process.env.DB_DATABASE || "HanoiMarathonDB",
      user: process.env.DB_USER || "sa",
      password: process.env.DB_PASSWORD || "123456",
      options: {
        encrypt: (process.env.DB_ENCRYPT || "false").toLowerCase() === "true",
        trustServerCertificate: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

let pool;

async function getPool() {
  if (pool) {
    return pool;
  }
  try {
    pool = await sql.connect(dbConfig);
    return pool;
  } catch (err) {
    console.error("Error connecting to SQL Server:", err);
    throw err;
  }
}

module.exports = {
  sql,
  getPool,
};
