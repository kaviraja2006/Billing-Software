const { withDB } = require("../db/db");
const { syncTableToJson } = require("../db/syncToJson");

// ------------------------------------
// CREATE CUSTOMER
// ------------------------------------
exports.createCustomer = async (req, res, next) => {
  try {
    const db = await withDB(req);

    const {
      fullName,
      phone,
      email = "",
      customerType = "Individual",
      gstin = "",
      address = {},
      source = "Walk-in",
      tags = [],
      loyaltyPoints = 0,
      notes = "",
    } = req.body;

    const [firstName, ...rest] = fullName.trim().split(" ");
    const lastName = rest.join(" ");

    const result = db.prepare(`
      INSERT INTO customers (
        firstName, lastName, phone, email,
        customerType, gstin, address,
        source, tags, loyaltyPoints, notes,
        createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      firstName,
      lastName,
      phone,
      email,
      customerType,
      gstin,
      JSON.stringify(address),
      source,
      JSON.stringify(tags),
      loyaltyPoints,
      notes
    );

    // Get the newly created customer
    const newCustomer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(result.lastInsertRowid);

    // Format the customer for response
    const formattedCustomer = {
      ...newCustomer,
      address: JSON.parse(newCustomer.address || "{}"),
      tags: JSON.parse(newCustomer.tags || "[]"),
      fullName: `${newCustomer.firstName} ${newCustomer.lastName}`.trim()
    };

    // 🔄 AUTO SYNC
    syncTableToJson({
      db,
      table: "customers",
      userBaseDir: req.userBaseDir,
      map: c => ({
        ...c,
        address: JSON.parse(c.address || "{}"),
        tags: JSON.parse(c.tags || "[]"),
        fullName: `${c.firstName} ${c.lastName}`.trim()
      })
    });

    res.status(201).json(formattedCustomer);
  } catch (error) {
    console.error('Error in createCustomer:', error);
    next(error);
  }
};
// GET ALL CUSTOMERS
// ------------------------------------
exports.getCustomers = async (req, res) => {
  const db = await withDB(req);

  const rows = db.prepare(`SELECT * FROM customers`).all();

  const customers = rows.map(c => ({
    ...c,
    tags: c.tags ? JSON.parse(c.tags) : [],
    address: c.address ? JSON.parse(c.address) : {},
    fullName: `${c.firstName} ${c.lastName || ""}`.trim(),
  }));

  res.json(customers);
};

// ------------------------------------
// DELETE CUSTOMER
// ------------------------------------
exports.deleteCustomer = async (req, res) => {
  const db = await withDB(req);
  db.prepare(`DELETE FROM customers WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
};

// ------------------------------------
// SEARCH DUPLICATES
// ------------------------------------
exports.searchDuplicates = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json([]);

  const db = await withDB(req);

  const rows = db.prepare(`
    SELECT *
    FROM customers
    WHERE phone LIKE ?
       OR email LIKE ?
    LIMIT 5
  `).all(`%${query}%`, `%${query}%`);

  const results = rows.map(c => ({
    ...c,
    tags: c.tags ? JSON.parse(c.tags) : [],
    address: c.address ? JSON.parse(c.address) : {},
    fullName: `${c.firstName} ${c.lastName || ""}`.trim(),
  }));

  res.json(results);
};

// ------------------------------------
// GET CUSTOMER BY ID
// ------------------------------------
exports.getCustomerById = async (req, res, next) => {
  try {
    const db = await withDB(req);
    const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const formattedCustomer = {
      ...customer,
      tags: customer.tags ? JSON.parse(customer.tags) : [],
      address: customer.address ? JSON.parse(customer.address) : {},
      fullName: `${customer.firstName} ${customer.lastName || ""}`.trim(),
    };

    res.json(formattedCustomer);
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    next(error);
  }
};

// ------------------------------------
// UPDATE CUSTOMER
// ------------------------------------
exports.updateCustomer = async (req, res, next) => {
  try {
    const db = await withDB(req);
    const {
      fullName,
      phone,
      email = "",
      customerType = "Individual",
      gstin = "",
      address = {},
      source = "Walk-in",
      tags = [],
      loyaltyPoints = 0,
      notes = "",
    } = req.body;

    const [firstName, ...rest] = fullName.trim().split(" ");
    const lastName = rest.join(" ");

    db.prepare(`
      UPDATE customers
      SET firstName = ?, lastName = ?, phone = ?, email = ?,
          customerType = ?, gstin = ?, address = ?,
          source = ?, tags = ?, loyaltyPoints = ?, notes = ?
      WHERE id = ?
    `).run(
      firstName,
      lastName,
      phone,
      email,
      customerType,
      gstin,
      JSON.stringify(address),
      source,
      JSON.stringify(tags),
      loyaltyPoints,
      notes,
      req.params.id
    );

    // Get the updated customer
    const updatedCustomer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);

    const formattedCustomer = {
      ...updatedCustomer,
      address: JSON.parse(updatedCustomer.address || "{}"),
      tags: JSON.parse(updatedCustomer.tags || "[]"),
      fullName: `${updatedCustomer.firstName} ${updatedCustomer.lastName}`.trim()
    };

    // 🔄 AUTO SYNC
    syncTableToJson({
      db,
      table: "customers",
      userBaseDir: req.userBaseDir,
      map: c => ({
        ...c,
        address: JSON.parse(c.address || "{}"),
        tags: JSON.parse(c.tags || "[]"),
        fullName: `${c.firstName} ${c.lastName}`.trim()
      })
    });

    res.json(formattedCustomer);
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    next(error);
  }
};

