const { app, BrowserWindow, systemPreferences, ipcMain } = require("electron");
const path = require("node:path");
const url = require("url");

const isDev = process.env.ELECTRON_START_URL ? true : false;

// Listen for the 'auth:touch-id' event from the renderer process
ipcMain.handle("auth:touch-id", async () => {
  try {
    // Prompt the user for Touch ID
    await systemPreferences.promptTouchID("Unlock Dentrak to access your data");
    // If successful, resolve the promise
    return { success: true };
  } catch (error) {
    // If it fails (user cancels, etc.), return an error
    console.error("Touch ID prompt failed:", error);
    return { success: false, error: error.message };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Attach the preload script
      preload: path.join(__dirname, "preload.js"),
      // These are recommended security settings
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startUrl = isDev
    ? process.env.ELECTRON_START_URL
    : url.format({
        pathname: path.join(__dirname, "/dist/index.html"),
        protocol: "file:",
        slashes: true,
      });

  win.loadURL(startUrl);

  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
