const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const analyticsService = require("./analytics");

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "KWIQ Bill",
    frame: false, // Custom Title Bar
    titleBarStyle: 'hidden', // Keeps window controls overlay on macOS, hidden on Windows
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    }
  });

  mainWindow.loadFile(
    path.join(__dirname, "../frontend/dist/index.html")
  );

  // Enable DevTools for debugging
  // mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Window Controls IPC
  ipcMain.handle('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('window-close', () => {
    mainWindow.close();
  });
}

// App ready
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    // Windows: Protocol handler comes in commandLine
    const url = commandLine.find((arg) => arg.startsWith("billing://"));
    if (url) {
      handleDeepLink(url);
    }
  });

  // Handle protocol for macOS
  app.on("open-url", (event, url) => {
    event.preventDefault();
    handleDeepLink(url);
  });

  app.whenReady().then(async () => {
    // Register custom protocol
    // Menu.setApplicationMenu(null);

    if (!app.isDefaultProtocolClient("billing")) {
      const args = [];
      if (process.argv.length > 1) {
        args.push(path.resolve(process.argv[1]));
      }
      app.setAsDefaultProtocolClient("billing", process.execPath, args);
    }

    backendProcess = require("./start-backend");
    createWindow();

    // Initialize analytics service
    await analyticsService.initialize();

    // Send initial ping (will check if user is logged in)
    setTimeout(() => {
      analyticsService.sendTelemetryPing().catch(err => {
        console.error('Initial telemetry ping failed:', err);
      });
    }, 5000); // Wait 5 seconds for app to fully load
  });
}

function handleDeepLink(url) {
  // billing://auth?token=...
  console.log("Deep link received:", url);
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const token = params.get("token");

    if (token && mainWindow) {
      console.log("Sending token to renderer");
      mainWindow.webContents.send("google-auth-success", token);
    }
  } catch (err) {
    console.error("Invalid deep link:", err);
  }
}

// Listen for user login to update analytics with user info
ipcMain.on('user-logged-in', (event, user) => {
  console.log('User logged in, updating analytics');
  analyticsService.setUserInfo(user);

  // Force telemetry ping with updated user info (bypass 24h interval)
  analyticsService.forcePing().catch(err => {
    console.error('Post-login telemetry ping failed:', err);
  });
});

// Quit properly
app.on("window-all-closed", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

