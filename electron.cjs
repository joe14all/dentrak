const {
  app,
  BrowserWindow,
  systemPreferences,
  ipcMain,
  dialog,
} = require("electron");
const path = require("node:path");
const url = require("url");
const fs = require("fs");

const isDev = process.env.ELECTRON_START_URL ? true : false;

/**
 * Development Port Configuration:
 * - Dentrak Vite: 5174
 * - JBook Vite: 5173
 * - JBook API: 47832 (for Dentrak → JBook sync)
 */
const JBOOK_API_PORT = 47832;

// --- Corrected Touch ID / Fingerprint Logic ---
// This now uses the systemPreferences API which is compatible with your Electron version.
ipcMain.handle("auth:touch-id", async () => {
  try {
    await systemPreferences.promptTouchID("Unlock Dentrak to access your data");
    return { success: true };
  } catch (error) {
    console.error("Touch ID prompt failed:", error);
    return { success: false, error: error.message };
  }
});

// --- PDF Saving Logic ---
ipcMain.handle("save-pdf", async (event, pdfData, suggestedName) => {
  const win = BrowserWindow.getFocusedWindow();
  const { filePath, canceled } = await dialog.showSaveDialog(win, {
    title: "Save PDF Summary",
    defaultPath: suggestedName,
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
  });

  if (canceled || !filePath) {
    return { success: false, message: "Save was canceled." };
  }

  try {
    const buffer = Buffer.from(pdfData, "base64");
    fs.writeFileSync(filePath, buffer);
    return { success: true, path: filePath };
  } catch (error) {
    console.error("Failed to save PDF:", error);
    return { success: false, message: `Failed to save PDF: ${error.message}` };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
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
