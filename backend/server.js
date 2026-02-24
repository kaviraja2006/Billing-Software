console.log("Server file loaded");

const path = require("path");

// Load environment from explicit path passed by Electron main process
const envPath = process.env.ENV_FILE_PATH || path.join(__dirname, ".env");

console.log(`Loading environment from: ${envPath}`);
require("dotenv").config({ path: envPath });

const app = require("./src/app");

const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
