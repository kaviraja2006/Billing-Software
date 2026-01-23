const { spawn } = require("child_process");
const path = require("path");

const backendPath = path.join(__dirname, "..", "backend", "server.js");

const backend = spawn("node", [backendPath], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: process.env.PORT || 5000,
  }
});

module.exports = backend;
