const { openUserDatabase } = require("./connection");
const schema = require("fs").readFileSync(
  require("path").join(__dirname, "schema.sql"),
  "utf8"
);

async function initDB(googleSub) {
  const db = await openUserDatabase(googleSub);
  db.exec(schema);
  return db;
}

module.exports = { initDB };
