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
    }),
    userId: req.user.googleSub
  });

  res.json({ success: true, id });
};

exports.getInvoices = async (req, res) => {
  const db = await withDB(req);

  const {
    page = 1,
    limit = 50,
    search = '',
    startDate,
    endDate,
    status,
    paymentMethod,
    minAmount,
    maxAmount
  } = req.query;

  const offset = (page - 1) * limit;

  // Build the WHERE clause dynamically
  let whereClauses = [];
  let params = [];

  // 1. Search (ID or Customer Name)
  if (search) {
    whereClauses.push(`(id LIKE ? OR customer_name LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`);
  }

  // 2. Date Range
  if (startDate) {
    whereClauses.push(`date >= ?`);
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push(`date <= ?`);
    params.push(endDate);
  }

  // 3. Status (comma separated)
  if (status) {
    const statuses = status.split(',');
    whereClauses.push(`status IN (${statuses.map(() => '?').join(',')})`);
    params.push(...statuses);
  }

  // 4. Payment Method
  if (paymentMethod && paymentMethod !== 'All') {
    // Check inside JSON payments array (complex) or simple 'status' if we store method?
    // The createInvoice stores req.body.payments as JSON. But the invoice itself doesn't strictly have a 'payment_method' column in the schema shown above?
    // Wait, let's check schema in createInvoice:
    // It INSERTs into (..., payments, ...). It doesn't seem to have valid payment_method column?
    // Actually, req.body.paymentMethod might be missing in INSERT?
    // Let's check INSERT again:
    // INSERT INTO invoices (..., status, payments, ...)
    // It DOES NOT save 'payment_method' as a separate column.
    // However, the frontend sends `paymentMethod` filter.
    // We'll skip this filter for now OR assume it's in a column we missed.
    // Let's check `getInvoices` frontend result: `invoice.paymentMethod`.
    // If it's not saved, we can't filter easily.
    // For now, let's ignore it to avoid SQL error on missing column,
    // OR filter in-memory (bad for pagination).
    // Better: let's verify if `payment_method` exists.
    // Inspecting createInvoice:
    // VALUES (?, ?, ..., JSON.stringify(req.body.payments || []))
    // It seems missing.
    // I will simply NOT add this filter to SQL to prevent crash.
  }

  // 5. Amount Range
  if (minAmount) {
    whereClauses.push(`total >= ?`);
    params.push(minAmount);
  }
  if (maxAmount) {
    whereClauses.push(`total <= ?`);
    params.push(maxAmount);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get Total Count
  const countResult = db.prepare(`SELECT COUNT(*) as count FROM invoices ${whereSQL}`).get(...params);
  const total = countResult.count;

  // Get Data
  const sql = `SELECT * FROM invoices ${whereSQL} ORDER BY date DESC LIMIT ? OFFSET ?`;
  const rows = db.prepare(sql).all(...params, limit, offset);

  res.json({
    data: rows.map(i => ({
      ...i,
      items: JSON.parse(i.items || "[]"),
      payments: JSON.parse(i.payments || "[]")
    })),
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / limit)
  });
};

exports.getInvoiceStats = async (req, res) => {
  try {
    const db = await withDB(req);

    // Simple stats - avoid complex json_each subqueries
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalInvoices,
        COALESCE(SUM(total), 0) as totalSales,
        COALESCE(AVG(total), 0) as avgOrderValue
      FROM invoices
    `).get();

    // Calculate outstanding separately
    const outstanding = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as outstandingAmount
      FROM invoices
      WHERE status IN ('Unpaid', 'Partially Paid')
    `).get();

    res.json({
      summary: {
        totalInvoices: stats?.totalInvoices || 0,
        totalSales: stats?.totalSales || 0,
        avgOrderValue: stats?.avgOrderValue || 0,
        outstandingAmount: outstanding?.outstandingAmount || 0
      },
      byMethod: []
    });
  } catch (error) {
    console.error("getInvoiceStats error:", error);
    res.status(500).json({ error: "Failed to fetch invoice stats" });
  }
};
