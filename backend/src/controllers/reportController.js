const { withDB } = require("../db/db");
const { exportReport } = require("../db/exportReport");
/**
 * Dashboard summary
 */
exports.getDashboardStats = async (req, res) => {
  const db = await withDB(req);
  const { startDate, endDate } = req.query;

  // Helper to build date clause
  const buildParams = (dateCol) => {
    const conditions = [];
    const args = [];
    if (startDate) {
      conditions.push(`date(${dateCol}) >= date(?)`);
      args.push(startDate);
    }
    if (endDate) {
      conditions.push(`date(${dateCol}) <= date(?)`);
      args.push(endDate);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { where, args };
  };

  // 1. Sales & Orders
  const inv = buildParams('date');
  const salesStats = db.prepare(`
    SELECT 
      COALESCE(SUM(total), 0) as sales, 
      COUNT(*) as orders 
    FROM invoices 
    ${inv.where}
  `).get(...inv.args);

  const sales = salesStats.sales || 0;
  const orders = salesStats.orders || 0;
  const aov = orders > 0 ? (sales / orders) : 0;

  // 2. Expenses
  const exp = buildParams('date');
  const expenses = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM expenses 
    ${exp.where}
  `).get(...exp.args).total || 0;

  // 3. Profit
  const netProfit = sales - expenses;

  // 4. Counts
  const totalCustomers = db.prepare(`SELECT COUNT(*) as count FROM customers`).get().count || 0;

  const pendingInvoices = db.prepare(`
    SELECT COUNT(*) as count FROM invoices WHERE status = 'Unpaid' OR status = 'Pending'
  `).get().count || 0;

  // Return structure supporting BOTH Dashboard.jsx (flat) and ReportsPage.jsx (nested)
  res.json({
    // New Structure
    sales: { value: sales, prev: 0, change: 0, sparkline: [] },
    orders: { value: orders, prev: 0, change: 0 },
    expenses: { value: expenses, prev: 0, change: 0 },
    netProfit: { value: netProfit, prev: 0, change: 0 },
    aov: { value: aov, prev: 0, change: 0 },

    // Legacy Structure (for Dashboard.jsx)
    totalSales: sales,
    totalOrders: orders,
    totalCustomers: totalCustomers,
    totalExpenses: expenses,
    pendingInvoices: pendingInvoices,
    trends: { sales: 0, orders: 0 } // Mock trends for Dashboard.jsx
  });
};

/**
 * Financial summary
 */
exports.getFinancials = async (req, res) => {
  const db = await withDB(req);
  const { startDate, endDate } = req.query;

  // Build Filter
  let querySales = `SELECT COALESCE(SUM(total), 0) AS value FROM invoices WHERE 1=1`;
  let queryExpenses = `SELECT COALESCE(SUM(amount), 0) AS value FROM expenses WHERE 1=1`;
  const args = [];

  if (startDate) {
    querySales += ` AND date(date) >= date(?)`;
    queryExpenses += ` AND date(date) >= date(?)`;
    args.push(startDate);
  }
  if (endDate) {
    querySales += ` AND date(date) <= date(?)`;
    queryExpenses += ` AND date(date) <= date(?)`;
    args.push(endDate);
  }

  // Execute
  // Note: args need to be doubled for expenses if we used a single query, but here we run two separate queries
  // We need to re-construct args for each query

  const argsSales = [];
  const argsExpenses = [];
  if (startDate) { argsSales.push(startDate); argsExpenses.push(startDate); }
  if (endDate) { argsSales.push(endDate); argsExpenses.push(endDate); }

  const income = db.prepare(querySales).get(...argsSales).value;
  const expenses = db.prepare(queryExpenses).get(...argsExpenses).value;

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
  const { startDate, endDate } = req.query;

  let query = `SELECT items FROM invoices WHERE 1=1`;
  const params = [];

  if (startDate) {
    query += ` AND date(date) >= date(?)`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND date(date) <= date(?)`;
    params.push(endDate);
  }

  // Using JS aggregation to be safe with SQLite JSON nuances in this env
  const invoices = db.prepare(query).all(...params);

  const productStats = {};

  invoices.forEach(inv => {
    try {
      const items = JSON.parse(inv.items);
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (item.name) {
            productStats[item.name] = (productStats[item.name] || 0) + (item.quantity || 0);
          }
        });
      }
    } catch (e) {
      // ignore parse errors
    }
  });

  const sortedProducts = Object.entries(productStats)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  res.json(sortedProducts);
};

exports.getPaymentMethods = async (req, res) => {
  const db = await withDB(req);
  const { startDate, endDate } = req.query;

  let query = `SELECT payments FROM invoices WHERE 1=1`;
  const params = [];

  if (startDate) {
    query += ` AND date(date) >= date(?)`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND date(date) <= date(?)`;
    params.push(endDate);
  }

  const invoices = db.prepare(query).all(...params);
  const methodStats = {};

  invoices.forEach(inv => {
    try {
      const payments = JSON.parse(inv.payments);
      if (Array.isArray(payments)) {
        payments.forEach(p => {
          if (p.mode && p.amount) {
            methodStats[p.mode] = (methodStats[p.mode] || 0) + parseFloat(p.amount);
          }
        });
      }
    } catch (e) {
      // ignore
    }
  });

  const result = Object.entries(methodStats).map(([method, amount]) => ({
    name: method,
    value: amount
  }));

  res.json(result);
};

exports.getSalesTrend = async (req, res) => {
  const db = await withDB(req);
  const { startDate, endDate } = req.query;

  let query = `SELECT date, total FROM invoices WHERE 1=1`;
  const params = [];

  if (startDate) {
    query += ` AND date(date) >= date(?)`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND date(date) <= date(?)`;
    params.push(endDate);
  }
  query += ` ORDER BY date ASC`;

  const invoices = db.prepare(query).all(...params);

  // Aggregate by day
  const trend = {};

  invoices.forEach(inv => {
    const day = inv.date.split('T')[0]; // Simple YYYY-MM-DD extraction
    trend[day] = (trend[day] || 0) + (inv.total || 0);
  });

  const result = Object.entries(trend)
    .map(([date, amount]) => ({ date, sales: amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json(result);
};

exports.getCustomerMetrics = async (req, res) => {
  const db = await withDB(req);
  const { startDate, endDate } = req.query;

  // New Customers in period
  let newCustQuery = `SELECT COUNT(*) as count FROM customers WHERE 1=1`;
  const newCustParams = [];
  if (startDate) {
    newCustQuery += ` AND date(createdAt) >= date(?)`;
    newCustParams.push(startDate);
  }
  if (endDate) {
    newCustQuery += ` AND date(createdAt) <= date(?)`;
    newCustParams.push(endDate);
  }
  const newCustomers = db.prepare(newCustQuery).get(...newCustParams)?.count || 0;

  // Returning customers (bought in period and has previous orders, or just > 1 order total?)
  // Let's go with: customers who bought in this period and have > 1 invoice total.
  // First get customers who bought in period
  let activeCustQuery = `SELECT DISTINCT customer_id FROM invoices WHERE 1=1`;
  const activeCustParams = [];
  if (startDate) {
    activeCustQuery += ` AND date(date) >= date(?)`;
    activeCustParams.push(startDate);
  }
  if (endDate) {
    activeCustQuery += ` AND date(date) <= date(?)`;
    activeCustParams.push(endDate);
  }
  const activeCustomers = db.prepare(activeCustQuery).all(...activeCustParams).map(c => c.customer_id);

  let returningCustomers = 0;
  if (activeCustomers.length > 0) {
    const placeholders = activeCustomers.map(() => '?').join(',');
    // Check which of these have > 1 invoice
    const returningCount = db.prepare(`
      SELECT COUNT(DISTINCT customer_id) as count 
      FROM invoices 
      WHERE customer_id IN (${placeholders}) 
      GROUP BY customer_id 
      HAVING COUNT(*) > 1
    `).all(...activeCustomers).length;
    returningCustomers = returningCount;
  }

  const totalActive = activeCustomers.length;
  const repeatRate = totalActive > 0 ? (returningCustomers / totalActive) * 100 : 0;

  // CLV - Average value of all orders per customer (simplified)
  // or Total Sales / Total Unique Customers (All Time)
  const clvStats = db.prepare(`
    SELECT 
      SUM(total) as totalSales, 
      COUNT(DISTINCT customer_id) as totalCust 
    FROM invoices
  `).get();

  const clv = clvStats.totalCust > 0 ? (clvStats.totalSales / clvStats.totalCust) : 0;

  res.json({
    newCustomers,
    returningCustomers,
    repeatRate,
    clv
  });
};
