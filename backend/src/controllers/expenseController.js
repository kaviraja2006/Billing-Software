const { withDB } = require("../db/db");
const { syncTableToJson } = require("../db/syncToJson");
const { v4: uuid } = require("uuid");

exports.createExpense = async (req, res) => {
  const db = await withDB(req);
  const id = uuid();
  const date = req.body.date || new Date().toISOString();

  const newExpense = {
    id,
    title: req.body.title,
    amount: req.body.amount,
    category: req.body.category,
    date,
    paymentMethod: req.body.paymentMethod || "Cash",
    tags: req.body.tags || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.prepare(`
    INSERT INTO expenses (
      id, title, amount, category, date,
      payment_method, tags, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newExpense.id,
    newExpense.title,
    newExpense.amount,
    newExpense.category,
    newExpense.date,
    newExpense.paymentMethod,
    JSON.stringify(newExpense.tags),
    newExpense.created_at,
    newExpense.updated_at
  );

  // 🔄 AUTO JSON SYNC
  syncTableToJson({
    db,
    table: "expenses",
    userBaseDir: req.userBaseDir,
    map: e => ({
      ...e,
      tags: JSON.parse(e.tags || "[]")
    }),
    userId: req.user.googleSub
  });

  res.json({ success: true, ...newExpense });
};

exports.getExpenses = async (req, res) => {
  const db = await withDB(req);
  // Get expenses with aggregated adjustments
  const rows = db.prepare(`
    SELECT e.*, COALESCE(SUM(a.delta_amount), 0) as adjustment_total
    FROM expenses e
    LEFT JOIN expense_adjustments a ON e.id = a.expense_id
    GROUP BY e.id
  `).all();

  res.json(
    rows.map(e => ({
      ...e,
      // The stored 'amount' is the original. The effective amount is original + adjustments.
      amount: (e.amount || 0) + (e.adjustment_total || 0),
      originalAmount: e.amount,
      tags: JSON.parse(e.tags || "[]")
    }))
  );
};

exports.updateExpense = async (req, res) => {
  const db = await withDB(req);
  const { id } = req.params;
  const { title, category, date, paymentMethod, tags, amount, description } = req.body;

  // 1. Get current state (Original + Adjustments)
  const current = db.prepare(`
    SELECT e.*, COALESCE(SUM(a.delta_amount), 0) as adjustment_total
    FROM expenses e
    LEFT JOIN expense_adjustments a ON e.id = a.expense_id
    WHERE e.id = ?
    GROUP BY e.id
  `).get(id);

  if (!current) {
    return res.status(404).json({ success: false, message: "Expense not found" });
  }

  const currentTotal = (current.amount || 0) + (current.adjustment_total || 0);
  const newAmount = parseFloat(amount);
  const delta = newAmount - currentTotal;

  // 2. Insert Adjustment for Amount Change
  if (Math.abs(delta) > 0.001) { // Floating point check
    const adjustmentId = uuid();
    db.prepare(`
      INSERT INTO expense_adjustments (id, expense_id, delta_amount, reason, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      adjustmentId,
      id,
      delta,
      "Update via Edit",
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  // 3. Update Metadata (Title, Category, etc.) - Keeps 'amount' unchanged!
  // Note: We are allowing metadata overwrites for now as per plan, but strictly auditing amount.
  db.prepare(`
    UPDATE expenses
    SET title = ?, category = ?, date = ?, payment_method = ?, tags = ?, updated_at = ?
    WHERE id = ?
  `).run(
    title,
    category,
    date,
    paymentMethod,
    JSON.stringify(tags || []),
    new Date().toISOString(),
    id
  );

  // 4. Return Updated View
  const updated = db.prepare(`
    SELECT e.*, COALESCE(SUM(a.delta_amount), 0) as adjustment_total
    FROM expenses e
    LEFT JOIN expense_adjustments a ON e.id = a.expense_id
    WHERE e.id = ?
    GROUP BY e.id
  `).get(id);

  const response = {
    ...updated,
    amount: (updated.amount || 0) + (updated.adjustment_total || 0),
    tags: JSON.parse(updated.tags || "[]"),
    // return delta info for sync event trigger
    _syncInfo: {
      delta,
      reason: "Update via Edit"
    }
  };

  // 🔄 AUTO JSON SYNC
  syncTableToJson({
    db,
    table: "expenses",
    userBaseDir: req.userBaseDir,
    map: e => ({ ...e, tags: JSON.parse(e.tags || "[]") }),
    userId: req.user.googleSub
  });

  res.json({ success: true, ...response });
};
