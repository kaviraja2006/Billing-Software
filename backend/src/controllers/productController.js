const { withDB } = require("../db/db");
const { syncTableToJson } = require("../db/syncToJson");
const { v4: uuid } = require("uuid");

exports.createProduct = async (req, res, next) => {
  try {
    const db = await withDB(req);

    db.prepare(`
      INSERT INTO products (
        id, name, sku, category, price, stock, unit,
        tax_rate, variants, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuid(),
      req.body.name,
      req.body.sku,
      req.body.category,
      req.body.price,
      req.body.stock,
      req.body.unit || "pcs",
      req.body.taxRate || 0,
      JSON.stringify(req.body.variants || []),
      new Date().toISOString(),
      new Date().toISOString()
    );

    // 🔄 AUTO JSON SYNC
    syncTableToJson({
      db,
      table: "products",
      userBaseDir: req.userBaseDir,
      map: p => ({
        ...p,
        variants: JSON.parse(p.variants || "[]")
      })
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error in createProduct:', error);
    next(error);
  }
};

exports.getProducts = async (req, res) => {
  const db = await withDB(req);
  const rows = db.prepare(`SELECT * FROM products`).all();

  res.json(
    rows.map(p => ({
      ...p,
      variants: JSON.parse(p.variants || "[]")
    }))
  );
};

exports.updateStock = async (req, res, next) => {
  try {
    const db = await withDB(req);

    db.prepare(`
      UPDATE products SET stock = stock + ?, updated_at = ?
      WHERE id = ?
    `).run(req.body.delta, new Date().toISOString(), req.params.id);

    // 🔄 AUTO JSON SYNC
    syncTableToJson({
      db,
      table: "products",
      userBaseDir: req.userBaseDir,
      map: p => ({
        ...p,
        variants: JSON.parse(p.variants || "[]")
      })
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error in updateStock:', error);
    next(error);
  }
};
