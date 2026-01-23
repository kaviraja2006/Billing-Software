const { withDB } = require("../db/db");
const { syncTableToJson } = require("../db/syncToJson");
const { v4: uuid } = require("uuid");

exports.createInvoice = async (req, res) => {
  const db = await withDB(req);
  const id = uuid();

  db.prepare(`
    INSERT INTO invoices (
      id, customer_id, customer_name, date, type,
      items, subtotal, tax, discount, total,
      status, payments, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.body.customerId || null,
    req.body.customerName,
    new Date().toISOString(),
    req.body.type || "Retail",
    JSON.stringify(req.body.items),
    req.body.subtotal,
    req.body.tax,
    req.body.discount,
    req.body.total,
    req.body.status || "Paid",
    JSON.stringify(req.body.payments || []),
    new Date().toISOString(),
    new Date().toISOString()
  );

  // 🔄 AUTO JSON SYNC
  syncTableToJson({
    db,
    table: "invoices",
    userBaseDir: req.userBaseDir,
    map: i => ({
      ...i,
      items: JSON.parse(i.items || "[]"),
      payments: JSON.parse(i.payments || "[]")
    })
  });

  res.json({ success: true, id });
};

exports.getInvoices = async (req, res) => {
  const db = await withDB(req);
  const rows = db.prepare(`SELECT * FROM invoices`).all();

  res.json(
    rows.map(i => ({
      ...i,
      items: JSON.parse(i.items || "[]"),
      payments: JSON.parse(i.payments || "[]")
    }))
  );
};
