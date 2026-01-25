CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  customerType TEXT,
  gstin TEXT,
  address TEXT,
  source TEXT,
  tags TEXT,
  loyaltyPoints INTEGER DEFAULT 0,
  notes TEXT,
  createdAt TEXT
);




CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT,
  price REAL,
  stock INTEGER,
  unit TEXT,
  tax_rate REAL,
  variants JSON,
  created_at TEXT,
  updated_at TEXT,
  UNIQUE (sku)
);
 


 CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT,
  date TEXT,
  type TEXT,
  items JSON,
  subtotal REAL,
  tax REAL,
  discount REAL,
  total REAL,
  status TEXT,
  payments JSON,
  created_at TEXT,
  updated_at TEXT
);


CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT,
  amount REAL,
  category TEXT,
  date TEXT,
  payment_method TEXT,
  tags JSON,
  created_at TEXT,
  updated_at TEXT
);
 

 CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  data JSON,
  updated_at TEXT
);
