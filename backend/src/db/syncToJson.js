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
const { performBackup } = require("../services/backupService");

// Debounce Map: userId -> timeoutId
const debounceMap = new Map();

/**
 * Sync any SQLite table to a JSON file
 *
 * @param {Object} options
 * @param {Object} options.db       - better-sqlite3 instance
 * @param {string} options.table    - table name
 * @param {string} options.userBaseDir  - base user directory
 * @param {Function} [options.map]  - optional row transformer
 * @param {string} [options.userId] - Google User ID (for backup trigger)
 */
function syncTableToJson({ db, table, userBaseDir, map, userId }) {
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

  // ☁️ Trigger Cloud Backup (Debounced 30s)
  if (userId) {
    if (debounceMap.has(userId)) {
      clearTimeout(debounceMap.get(userId));
    }

    const timeoutId = setTimeout(() => {
      performBackup(userId, userBaseDir).then(res => {
        if (res.success) console.log("☁️  Auto-Backup Success");
        else console.log("⚠️ Auto-Backup Skipped/Failed (Auth likely needed)");
      });
      debounceMap.delete(userId);
    }, 30000); // 30 seconds debounce

    debounceMap.set(userId, timeoutId);
  }
}

module.exports = { syncTableToJson };
