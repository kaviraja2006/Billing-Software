const { withDB } = require("../db/db");
const {exportReport} = require("../db/exportReport");
/**
 * Dashboard summary
 */
exports.getDashboardStats = async (req, res) => {
  const db = await withDB(req);

  const totalSales = db
    .prepare(`SELECT COALESCE(SUM(total), 0) AS value FROM invoices`)
    .get().value;

  const totalInvoices = db
    .prepare(`SELECT COUNT(*) AS value FROM invoices`)
    .get().value;

  const totalCustomers = db
    .prepare(`SELECT COUNT(*) AS value FROM customers`)
    .get().value;

  res.json({
    totalSales,
    totalInvoices,
    totalCustomers,
  });
};

/**
 * Financial summary
 */
exports.getFinancials = async (req, res) => {
  const db = await withDB(req);

  const income = db
    .prepare(`SELECT COALESCE(SUM(total), 0) AS value FROM invoices`)
    .get().value;

  const expenses = db
    .prepare(`SELECT COALESCE(SUM(amount), 0) AS value FROM expenses`)
    .get().value;

  res.json({
    income,
    expenses,
    profit: income - expenses,
  });
};

/**
 * Top products
 */
exports.getTopProducts = async (req, res) => {
  const db = await withDB(req);

  const rows = db.prepare(`
    SELECT
      json_extract(items.value, '$.name') AS name,
      SUM(json_extract(items.value, '$.quantity')) AS quantity
    FROM invoices,
         json_each(invoices.items) AS items
    GROUP BY name
    ORDER BY quantity DESC
    LIMIT 5
  `).all();

  res.json(rows);
};
