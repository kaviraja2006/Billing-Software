const { app, BrowserWindow } = require("electron");
const path = require("path");
const { initDatabase } = require("../storage/local/database");
const { registerHandlers } = require("./ipcHandlers");

// ✅ START BACKEND FIRST (CRITICAL)
// For now, we still start the backend, but the UI should prefer IPC if available
require("./start-backend");

let mainWindow;

// 🔐 Windows deep-link handling
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, argv) => {
    const url = argv.find(arg => arg.startsWith("billing://"));
    if (url && mainWindow) {
      const token = new URL(url).searchParams.get("token");
      if (token) {
        mainWindow.webContents.send("auth-token", token);
      }
      mainWindow.focus();
    }
  });
}

// 🍎 macOS deep links
app.on("open-url", (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    const token = new URL(url).searchParams.get("token");
    if (token) {
      mainWindow.webContents.send("auth-token", token);
    }
  }
});

// ✅ Protocol registration (DEV + PROD)
if (process.defaultApp) {
  app.setAsDefaultProtocolClient(
    "billing",
    process.execPath,
    [path.resolve(process.argv[1])]
  );
} else {
  app.setAsDefaultProtocolClient("billing");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false // Ensure security
    },
  });

  mainWindow.loadFile(
    path.join(__dirname, "../frontend/dist/index.html")
  );
}

app.whenReady().then(() => {
  // Initialize DB
  const userDataPath = app.getPath('userData');
  initDatabase(userDataPath);

  // Register IPC Handlers
  registerHandlers();

  createWindow();
});
