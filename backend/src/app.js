const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const passport = require("passport");
const session = require("express-session");
const userContext = require("./middleware/userContext");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Google OAuth only
require("./config/googleStrategy");

const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const productRoutes = require("./routes/productRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const { protect } = require("./middleware/authMiddleware");

const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "electron-local-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Electron = localhost
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(passport.initialize());
app.use(passport.session());
// app.use(userContext); // ❌ REMOVED: This blocks /auth routes!

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5000",
      "http://localhost:5005",
      /^https:\/\/.*\.vercel\.app$/,
    ],
    credentials: true,
  })
);

app.use(helmet());
app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {
  res.send("API is running...");
});

app.use("/auth", authRoutes); // ✅ Public access allowed

// Protect these routes with JWT authentication + userContext
app.use("/customers", protect, userContext, customerRoutes);
app.use("/products", protect, userContext, productRoutes);
app.use("/invoices", protect, userContext, invoiceRoutes);
app.use("/expenses", protect, userContext, expenseRoutes);
app.use("/reports", protect, userContext, reportRoutes);
app.use("/settings", protect, userContext, settingsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
