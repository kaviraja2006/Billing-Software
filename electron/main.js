console.log("🔥 Electron main process started");

const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
// const analyticsService = require("./analytics");

let mainWindow = null;
let authWindow = null;
let backendProcess = null;

/**
 * Create authentication window
 */
function createAuthWindow(authUrl) {
  if (authWindow) {
    authWindow.focus();
    return;
  }

  console.log("🔐 Creating auth window for:", authUrl);

  authWindow = new BrowserWindow({
    width: 500,
    height: 600,
    title: "Login",
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    parent: mainWindow, // Make it a child of the main window
    modal: true,        // Block interaction with main window
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  authWindow.loadURL(authUrl);

  // Handle redirects to capture token
  authWindow.webContents.on('will-redirect', (event, url) => {
    console.log("🔀 Auth window redirecting to:", url);
    handleAuthRedirect(url);
  });

  // Also check navigation (some redirects might happen via JS)
  authWindow.webContents.on('will-navigate', (event, url) => {
    console.log("🧭 Auth window navigating to:", url);
    handleAuthRedirect(url);
  });

  authWindow.on('closed', () => {
    authWindow = null;
  });
}

/**
 * Handle auth redirects to extract token
 */
function handleAuthRedirect(url) {
  // Check if it's our custom protocol or the success callback
  if (url.startsWith("billing://") || url.includes("/auth/success")) {
    console.log("🔗 Auth success URL detected:", url);

    try {
      // If it's the billing:// protocol
      if (url.startsWith("billing://")) {
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get("token");

        if (token) {
          console.log("✅ Token extracted from deep link");
          finishAuth(token);
        }
      }
      // If it's an http callback that contains the token (depends on backend implementation)
      // Assuming backend might redirect to something like localhost:5000/auth/success?token=...
      else if (url.includes("token=")) {
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get("token");
        if (token) {
          console.log("✅ Token extracted from URL parameters");
          finishAuth(token);
        }
      }
    } catch (err) {
      console.error("❌ Error parsing auth URL:", err);
    }
  }
}

/**
 * Finish authentication flow
 */
function finishAuth(token) {
  if (mainWindow) {
    console.log("📨 Sending auth token to main window");
    mainWindow.webContents.send("google-auth-success", token);
  }

  if (authWindow) {
    console.log("🔒 Closing auth window");
    authWindow.close();
  }
}

/**
 * Create main application window
 */
function createWindow() {
  console.log("🪟 createWindow called");

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "KWIQ Bill",
    frame: false,                 // Custom title bar
    titleBarStyle: "hidden",
    show: true,                   // Show immediately for debugging  
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const indexPath = path.join(__dirname, "../frontend/dist/index.html");
  console.log("📄 Loading frontend:", indexPath);

  // Load frontend
  mainWindow.loadFile(indexPath).then(() => {
    console.log("✅ Frontend loaded successfully");
  }).catch((err) => {
    console.error("❌ Failed to load frontend:", err);
  });

  // Show window only when ready (backup, already showing)
  mainWindow.once("ready-to-show", () => {
    console.log("✅ Window ready-to-show event fired");
    mainWindow.maximize(); // Force full screen (maximized)
  });

  // 🧹 FORCE CLEAR CACHE TO FIX STALE ASSETS
  if (mainWindow) {
    mainWindow.webContents.session.clearCache().then(() => {
      console.log("🧹 Session cache cleared successfully");
    });
    mainWindow.webContents.session.clearStorageData({ storages: ['shadercache', 'appcache'] });
  }

  // Handle outgoing links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Check if it's the Google Auth endpoint
    if (url.includes("/auth/google") || url.startsWith("https://accounts.google.com")) {
      console.log("🌍 Opening in-app auth window for:", url);
      createAuthWindow(url);
      return { action: "deny" };
    }

    // For other external links, open in browser
    if (url.startsWith("http") || url.startsWith("https")) {
      shell.openExternal(url);
      return { action: "deny" };
    }

    return { action: "allow" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    // Close auth window if it exists when main window closes
    if (authWindow) authWindow.close();
  });

  // Window controls IPC
  ipcMain.handle("window-minimize", () => mainWindow?.minimize());
  ipcMain.handle("window-maximize", () => {
    if (!mainWindow) return;
    mainWindow.isMaximized()
      ? mainWindow.unmaximize()
      : mainWindow.maximize();
  });
  ipcMain.handle("window-close", () => mainWindow?.close());
}

/**
 * Deep link handler (legacy/system level)
 */
function handleDeepLink(url) {
  console.log("🔗 Deep link received:", url);

  try {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get("token");

    if (token) {
      // If we have an auth window open, close it, it means the flow completed via deep link
      finishAuth(token);
    }
  } catch (err) {
    console.error("❌ Invalid deep link:", err);
  }
}

/**
 * Auto-Backup Timer
 */
let autoBackupInterval = null;
let autoBackupTimeout = null;
const BACKUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

async function triggerAutoBackup() {
  console.log("🔄 Auto-backup triggered...");

  try {
    // Make HTTP request to backend backup endpoint
    const axios = require('axios');
    const token = global.userToken; // Assuming token is stored globally when user logs in

    if (!token) {
      console.log("⚠️ Auto-backup skipped: User not authenticated");
      return;
    }

    const response = await axios.post('http://localhost:5000/backup/trigger', {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-automated-trigger': 'true'
      },
      timeout: 60000 // 1 minute timeout
    });

    if (response.data.success) {
      console.log("✅ Auto-backup completed successfully:", response.data.timestamp);

      // Notify user via system notification (optional)
      if (mainWindow) {
        mainWindow.webContents.send('backup-completed', {
          success: true,
          timestamp: response.data.timestamp
        });
      }
    } else {
      console.error("❌ Auto-backup failed:", response.data.error);
    }
  } catch (error) {
    console.error("❌ Auto-backup error:", error.message);

    // Don't spam logs for auth errors, they're expected when token expires
    if (error.response?.status !== 401) {
      console.error("Full error:", error);
    }
  }
}

function startAutoBackupTimer() {
  // Clear any existing timer & timeout to prevent duplicates
  stopAutoBackupTimer();

  console.log(`⏰ Starting auto-backup timer (every ${BACKUP_INTERVAL / (60 * 60 * 1000)} hours)`);

  // Run first backup after 5 minutes
  autoBackupTimeout = setTimeout(() => {
    triggerAutoBackup();
  }, 5 * 60 * 1000);

  // Then run every 6 hours
  autoBackupInterval = setInterval(() => {
    triggerAutoBackup();
  }, BACKUP_INTERVAL);
}

function stopAutoBackupTimer() {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval);
    autoBackupInterval = null;
  }
  if (autoBackupTimeout) {
    clearTimeout(autoBackupTimeout);
    autoBackupTimeout = null;
  }
  console.log("⏸️ Auto-backup timer stopped");
}

// IPC handlers for auto-backup control
ipcMain.on('set-user-token', (_, token) => {
  global.userToken = token;
  console.log("🔑 User token updated for auto-backup");

  // Restart timer when user logs in
  if (token) {
    startAutoBackupTimer();
  } else {
    stopAutoBackupTimer();
  }
});

/**
 * Single instance lock
 */
const gotTheLock = app.requestSingleInstanceLock();

console.log("🔐 Single instance lock obtained:", gotTheLock);

if (!gotTheLock) {
  console.log("❌ Another instance is running, quitting...");
  app.quit();
} else {
  console.log("✅ This is the only instance, continuing...");

  // Windows deep link handler
  app.on("second-instance", (_, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    const url = commandLine.find(arg => arg.startsWith("billing://"));
    if (url) handleDeepLink(url);
  });

  // macOS deep link handler
  app.on("open-url", (event, url) => {
    event.preventDefault();
    handleDeepLink(url);
  });

  app.whenReady().then(() => {
    console.log("✅ app.whenReady reached");

    // 🚀 Start backend process asynchronously
    const startBackend = require("./start-backend");
    backendProcess = startBackend();
    console.log("✅ Backend process starting...");

    // Register custom protocol (billing://)
    if (!app.isDefaultProtocolClient("billing")) {
      const args = process.defaultApp
        ? [path.resolve(process.argv[1])]
        : [];
      app.setAsDefaultProtocolClient("billing", process.execPath, args);
    }

    createWindow();

    // Start auto-backup timer (every 6 hours)
    startAutoBackupTimer();
  });
}

/**
 * Clean exit
 */
app.on("window-all-closed", () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

// --- Native Features IPC ---

// Print Receipt (Silent/Background)
ipcMain.handle('print-receipt', async (event, htmlContent, options = {}) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    const printOptions = {
      silent: options.silent !== undefined ? options.silent : true,
      printBackground: true,
      deviceName: options.printerName || ''
    };

    console.log("Main Process: Printing with options:", printOptions);

    return new Promise((resolve, reject) => {
      // Attempt to print
      printWindow.webContents.print(printOptions, (success, errorType) => {
        if (!success) {
          console.error("❌ Print failed:", errorType);
          // If silent print fails, we just log it and resolve true to avoid frontend errors/alerts
          // This mimics "fire and forget" if no printer is present during testing.
          resolve(true);
        } else {
          console.log("✅ Print initiated successfully");
          resolve(true);
        }
        printWindow.close();
      });
    });
  } catch (error) {
    console.error("❌ Print error:", error);
    printWindow.close();
    // Don't throw to frontend to avoid alerts
    return true;
  }
});

// Get Printers
ipcMain.handle('get-printers', async () => {
  if (mainWindow) {
    return mainWindow.webContents.getPrintersAsync();
  }
  return [];
});

// Save File Dialog
ipcMain.handle('save-file', async (event, { title, defaultPath, content, filters }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: title || 'Save File',
    defaultPath: defaultPath || 'download',
    filters: filters || [{ name: 'All Files', extensions: ['*'] }]
  });

  if (canceled || !filePath) return { success: false };

  try {
    fs.writeFileSync(filePath, content);
    return { success: true, filePath };
  } catch (error) {
    console.error("❌ File save error:", error);
    return { success: false, error: error.message };
  }
});

// Native Alert
ipcMain.handle('show-alert', async (event, message, type = 'info') => {
  const options = {
    type: type, // 'info', 'error', 'question', 'warning'
    buttons: ['OK'],
    defaultId: 0,
    title: type.charAt(0).toUpperCase() + type.slice(1),
    message: message,
  };
  await dialog.showMessageBox(mainWindow, options);
  return true;
});

// Native Confirm
ipcMain.handle('show-confirm', async (event, message) => {
  const options = {
    type: 'question',
    buttons: ['Cancel', 'Yes'],
    defaultId: 1,
    cancelId: 0,
    title: 'Confirm',
    message: message,
  };
  const { response } = await dialog.showMessageBox(mainWindow, options);
  return response === 1; // Returns true if 'Yes' clicked
});

// Shell - Open External URL
ipcMain.handle('shell-open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to open external URL:', error);
    return { success: false, error: error.message };
  }
});

// Show Item In Folder
ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  try {
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to show item in folder:', error);
    return { success: false, error: error.message };
  }
});

// Generate PDF
ipcMain.handle('generate-pdf', async (event, { html, filename }) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    const pdfData = await printWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 } // handled by CSS
    });

    // Use UserData folder (hidden/safe) to satisfy "no specific folders" request
    const invoicesDir = path.join(app.getPath('userData'), 'temp_invoices');

    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const cleanFilename = (filename || 'invoice').replace(/[^a-z0-9]/gi, '_');
    const filePath = path.join(invoicesDir, `${cleanFilename}.pdf`);

    fs.writeFileSync(filePath, pdfData);

    console.log("✅ PDF Generated:", filePath);
    printWindow.close();

    return { success: true, filePath };
  } catch (error) {
    console.error("❌ PDF Generation error:", error);
    printWindow.close();
    return { success: false, error: error.message };
  }
});

// Copy File to Clipboard (Windows)
ipcMain.handle('copy-file-to-clipboard', async (event, filePath) => {
  try {
    const { spawn } = require('child_process');

    // Check if file exists first
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File does not exist: ' + filePath };
    }

    // Use .NET directly for reliable FileDropList (works better than Set-Clipboard for cross-app paste)
    return await new Promise((resolve, reject) => {
      const ps = spawn('powershell', [
        '-noprofile',
        '-sta',
        '-command',
        `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetFileDropList([System.Collections.Specialized.StringCollection]@('${filePath}'))`
      ]);

      let stderrData = '';

      ps.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      ps.on('close', (code) => {
        if (code === 0) {
          console.log("✅ File copied to clipboard (spawn/.NET):", filePath);
          resolve({ success: true });
        } else {
          console.error("❌ PowerShell .NET exit code " + code, stderrData);
          resolve({ success: false, error: 'Clipboard failed: ' + stderrData });
        }
      });
      ps.on('error', (err) => {
        console.error("❌ Spawn error:", err);
        resolve({ success: false, error: err.message });
      });
    });
  } catch (error) {
    console.error("❌ Clipboard error:", error);
    return { success: false, error: error.message };
  }
});
