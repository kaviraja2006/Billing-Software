const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../backend/.env")
});

require("../backend/server");
