const { fork } = require("child_process");
const { app } = require("electron");
const path = require("path");
const fs = require("fs");

console.log("[Main] start-backend.js loaded");

/**
 * Start the backend server process
 * @returns {ChildProcess} The forked backend process
 */
function startBackend() {
  const backendPath = path.join(__dirname, "..", "backend", "server.js");
  const userDataPath = app.getPath("userData");

  console.log("[Main] Backend Path:", backendPath);
  console.log("[Main] User Data Path:", userDataPath);

  // Determine the correct .env path based on environment
  const isDev = !app.isPackaged || process.env.NODE_ENV === "development";
  const envFilePath = isDev
    ? path.join(__dirname, "..", "backend", ".env")      // Development: in backend/.env
    : path.join(process.resourcesPath, "backend", ".env"); // Production: in resources/backend/.env

  console.log("[Main] Backend .env path:", envFilePath);
  console.log("[Main] Forking backend process...");

  // Use fork instead of spawn to support ASAR archives in production
  const backend = fork(backendPath, [], {
    silent: true, // This allows us to pipe stdout/stderr
    env: {
      ...process.env,
      PORT: process.env.PORT || 5000,
      USER_DATA_PATH: userDataPath,
      ENV_FILE_PATH: envFilePath
    }
  });

  // Capture logs to file for production debugging
  const logFile = path.join(userDataPath, "backend.log");
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  function writeLog(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    logStream.write(logMessage);
    console.log(message); // Still output to console
  }

  backend.stdout.on('data', (data) => {
    writeLog(`[Backend]: ${data.toString().trim()}`);
  });

  backend.stderr.on('data', (data) => {
    writeLog(`[Backend-Error]: ${data.toString().trim()}`);
  });

  backend.on('error', (err) => {
    writeLog(`[Backend-Process-Error]: ${err.message}`);
  });

  backend.on('exit', (code, signal) => {
    writeLog(`[Backend-Exit]: Process exited with code ${code} and signal ${signal}`);
  });

  return backend;
}

module.exports = startBackend;
