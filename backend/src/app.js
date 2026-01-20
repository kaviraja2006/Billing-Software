const path = require("path");

// Load env FIRST (before passport / google strategy)
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const passport = require("passport");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// ✅ Register Google strategy (side-effect import)
require("./config/googleStrategy");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const productRoutes = require("./routes/productRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

// Initialize Passport
app.use(passport.initialize());

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5000",
      "https://zilling.netlify.app",
      "https://billing-software-o1qb.onrender.com",
      /^https:\/\/.*\.vercel\.app$/,
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(helmet());
app.use(express.json());

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/auth", authRoutes);
app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/expenses", expenseRoutes);
app.use("/reports", reportRoutes);
app.use("/settings", settingsRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
