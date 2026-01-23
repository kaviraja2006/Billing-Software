const { app, BrowserWindow,Menu } = require("electron");
const path = require("path");

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Billing Software",
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      devTools:false,
    }
  });

  mainWindow.loadFile(
    path.join(__dirname, "../frontend/dist/index.html")
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
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

  app.whenReady().then(() => {
    // Register custom protocol
    Menu.setApplicationMenu(null); 
     
    if (!app.isDefaultProtocolClient("billing")) {
      const args = [];
      if (process.argv.length > 1) {
        args.push(path.resolve(process.argv[1]));
      }
      app.setAsDefaultProtocolClient("billing", process.execPath, args);
    }

    backendProcess = require("./start-backend");
    createWindow();
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

// Quit properly
app.on("window-all-closed", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

