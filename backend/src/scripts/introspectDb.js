const { getPool, sql } = require('../config/db');
require('dotenv').config();

async function introspect() {
  try {
    const pool = await getPool();

    // List tables
    const tablesResult = await pool
      .request()
      .query(`
        SELECT
          TABLE_SCHEMA,
          TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `);

    // List columns
    const columnsResult = await pool
      .request()
      .query(`
        SELECT
          TABLE_SCHEMA,
          TABLE_NAME,
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
      `);

    // Primary keys
    const pkResult = await pool
      .request()
      .query(`
        SELECT
          KU.TABLE_SCHEMA,
          KU.TABLE_NAME,
          KU.COLUMN_NAME,
          KU.CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS TC
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KU
          ON TC.CONSTRAINT_NAME = KU.CONSTRAINT_NAME
          AND TC.TABLE_SCHEMA = KU.TABLE_SCHEMA
          AND TC.TABLE_NAME = KU.TABLE_NAME
        WHERE TC.CONSTRAINT_TYPE = 'PRIMARY KEY'
        ORDER BY KU.TABLE_SCHEMA, KU.TABLE_NAME, KU.ORDINAL_POSITION
      `);

    // Foreign keys
    const fkResult = await pool
      .request()
      .query(`
        SELECT
          fk.name AS FK_NAME,
          sch.name AS TABLE_SCHEMA,
          tp.name AS TABLE_NAME,
          cp.name AS COLUMN_NAME,
          sch_ref.name AS REF_SCHEMA,
          tr.name AS REF_TABLE_NAME,
          cr.name AS REF_COLUMN_NAME
        FROM sys.foreign_keys fk
        INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
        INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
        INNER JOIN sys.schemas sch ON tp.schema_id = sch.schema_id
        INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
        INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
        INNER JOIN sys.schemas sch_ref ON tr.schema_id = sch_ref.schema_id
        INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
        ORDER BY sch.name, tp.name, fk.name;
      `);

    const tables = tablesResult.recordset;
    const columns = columnsResult.recordset;
    const pks = pkResult.recordset;
    const fks = fkResult.recordset;

    const schema = {};

    for (const tbl of tables) {
      const key = `${tbl.TABLE_SCHEMA}.${tbl.TABLE_NAME}`;
      schema[key] = {
        schema: tbl.TABLE_SCHEMA,
        table: tbl.TABLE_NAME,
        columns: [],
        primaryKeys: [],
        foreignKeys: [],
      };
    }

    for (const col of columns) {
      const key = `${col.TABLE_SCHEMA}.${col.TABLE_NAME}`;
      if (!schema[key]) continue;
      schema[key].columns.push({
        name: col.COLUMN_NAME,
        type: col.DATA_TYPE,
        nullable: col.IS_NULLABLE === 'YES',
      });
    }

    for (const pk of pks) {
      const key = `${pk.TABLE_SCHEMA}.${pk.TABLE_NAME}`;
      if (!schema[key]) continue;
      schema[key].primaryKeys.push({
        column: pk.COLUMN_NAME,
        constraint: pk.CONSTRAINT_NAME,
      });
    }

    for (const fk of fks) {
      const key = `${fk.TABLE_SCHEMA}.${fk.TABLE_NAME}`;
      if (!schema[key]) continue;
      schema[key].foreignKeys.push({
        name: fk.FK_NAME,
        column: fk.COLUMN_NAME,
        references: {
          schema: fk.REF_SCHEMA,
          table: fk.REF_TABLE_NAME,
          column: fk.REF_COLUMN_NAME,
        },
      });
    }

    console.log('=== DATABASE SCHEMA ===');
    console.log(JSON.stringify(schema, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error introspecting database:', err);
    process.exit(1);
  }
}

introspect();












