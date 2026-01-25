const { withDB } = require("../db/db");
const { syncTableToJson } = require("../db/syncToJson");

exports.getSettings = async (req, res) => {
  const db = await withDB(req);
  const row = db.prepare(`SELECT data FROM settings LIMIT 1`).get();

  res.json(row ? JSON.parse(row.data) : {});
};

exports.saveSettings = async (req, res) => {
  const db = await withDB(req);

  db.prepare(`
    INSERT INTO settings (id, data, updated_at)
    VALUES ('singleton', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      data = excluded.data,
      updated_at = excluded.updated_at
  `).run(JSON.stringify(req.body), new Date().toISOString());

  // 🔄 AUTO JSON SYNC
  syncTableToJson({
    db,
    table: "settings",
    userBaseDir: req.userBaseDir,
    map: s => JSON.parse(s.data || "{}")
  });

  res.json({ success: true });
};
