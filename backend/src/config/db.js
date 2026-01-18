// NOTE: Database support has been removed.
// The app now uses JSON files for persistence.
// This module is kept only to avoid crashing if any legacy code still imports it.

function getPool() {
  throw new Error(
    "Database support has been removed. Use the JSON repositories instead.",
  );
}

module.exports = {
  sql: null,
  getPool,
};
