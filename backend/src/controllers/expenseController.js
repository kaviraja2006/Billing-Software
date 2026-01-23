const { withDB } = require("../db/db");
const { syncTableToJson } = require("../db/syncToJson");
const { v4: uuid } = require("uuid");

exports.createExpense = async (req, res) => {
  const db = await withDB(req);

  db.prepare(`
    INSERT INTO expenses (
      id, title, amount, category, date,
      payment_method, tags, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuid(),
    req.body.title,
    req.body.amount,
    req.body.category,
    req.body.date || new Date().toISOString(),
    req.body.paymentMethod || "Cash",
    JSON.stringify(req.body.tags || []),
    new Date().toISOString(),
    new Date().toISOString()
  );

  // 🔄 AUTO JSON SYNC
  syncTableToJson({
    db,
    table: "expenses",
    userBaseDir: req.userBaseDir,
    map: e => ({
      ...e,
      tags: JSON.parse(e.tags || "[]")
    })
  });

  res.json({ success: true });
};

exports.getExpenses = async (req, res) => {
  const db = await withDB(req);
  const rows = db.prepare(`SELECT * FROM expenses`).all();

  res.json(
    rows.map(e => ({
      ...e,
      tags: JSON.parse(e.tags || "[]")
    }))
  );
};
