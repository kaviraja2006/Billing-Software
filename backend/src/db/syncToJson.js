const fs = require("fs");
const path = require("path");

/**
 * Sync any SQLite table to a JSON file
 *
 * @param {Object} options
 * @param {Object} options.db       - better-sqlite3 instance
 * @param {string} options.table    - table name
 * @param {string} options.userBaseDir  - base user directory
 * @param {Function} [options.map]  - optional row transformer
 */
function syncTableToJson({ db, table, userBaseDir, map }) {
  const dataDir = path.join(userBaseDir, "data", table);

  fs.mkdirSync(dataDir, { recursive: true });

  const rows = db.prepare(`SELECT * FROM ${table}`).all();

  const output = map
    ? rows.map(map)
    : rows;

  const filePath = path.join(dataDir, `${table}.json`);

  fs.writeFileSync(
    filePath,
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  console.log(`🔄 Synced ${table} → ${filePath}`);
}

module.exports = { syncTableToJson };
