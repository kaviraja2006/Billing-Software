const { withDB } = require("../db/db");
const { syncTableToJson } = require("../db/syncToJson");

exports.getSettings = async (req, res) => {
  try {
    console.log(`[Settings] Fetching 'singleton' for user: ${req.user?.googleSub}`);
    const db = await withDB(req);

    // 🔑 Explicitly fetch the 'singleton' row
    const row = db.prepare(`SELECT data FROM settings WHERE id = 'singleton'`).get();

    if (!row) {
      console.warn(`[Settings] 'singleton' row NOT found. Checking generic LIMIT 1 for debugging...`);
      // Fallback/Debug only
      const fallback = db.prepare(`SELECT * FROM settings LIMIT 1`).get();
      if (fallback) console.log(`[Settings] Different row found: ID=${fallback.id}`);
    } else {
      try {
        const parsed = JSON.parse(row.data);
        console.log(`[Settings] Loaded. Onboarding: ${parsed.onboardingCompletedAt}`);
      } catch (e) {
        console.error("[Settings] JSON Parse Error:", e);
      }
    }

    res.json(row ? JSON.parse(row.data) : {});
  } catch (err) {
    console.error(`[Settings] Get Error:`, err);
    res.status(500).json({ message: "Failed to load settings", error: err.message });
  }
};

exports.saveSettings = async (req, res) => {
  try {
    console.log(`[Settings] Saving for user: ${req.user?.googleSub}`);
    const db = await withDB(req);

    const dataStr = JSON.stringify(req.body);

    // Explicit transaction for safety
    const saveTx = db.transaction(() => {
      db.prepare(`
            INSERT INTO settings (id, data, updated_at)
            VALUES ('singleton', ?, ?)
            ON CONFLICT(id) DO UPDATE SET
            data = excluded.data,
            updated_at = excluded.updated_at
        `).run(dataStr, new Date().toISOString());
    });

    saveTx();
    console.log(`[Settings] Saved successfully to SQLite`);

    // 🔄 AUTO JSON SYNC
    try {
      syncTableToJson({
        db,
        table: "settings",
        userBaseDir: req.userBaseDir,
        map: s => JSON.parse(s.data || "{}")
      });
    } catch (syncErr) {
      console.error("JSON Sync failed (non-fatal):", syncErr);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(`[Settings] Save Error:`, err);
    res.status(500).json({ message: "Failed to save settings", error: err.message });
  }
};
