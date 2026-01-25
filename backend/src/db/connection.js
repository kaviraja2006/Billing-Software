const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const keytar = require("keytar");

const SERVICE = "BillingSoftware";

async function openUserDatabase(googleSub) {
  const baseDir = path.join(
    require("os").homedir(),
    "Documents",
    "BillingSoftware",
    `google-${googleSub}`
  );

  fs.mkdirSync(path.join(baseDir, "db"), { recursive: true });
  fs.mkdirSync(path.join(baseDir, "uploads"), { recursive: true });

  const dbPath = path.join(baseDir, "db", "billing.db");

  let key = await keytar.getPassword(SERVICE, googleSub);
  if (!key) {
    key = require("crypto").randomBytes(32).toString("hex");
    await keytar.setPassword(SERVICE, googleSub, key);
  }

  const db = new Database(dbPath);
  db.pragma(`key = '${key}'`);
  db.pragma("journal_mode = WAL");

  return db;
}

module.exports = { openUserDatabase };
