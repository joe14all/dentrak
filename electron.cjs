const {
  app,
  BrowserWindow,
  systemPreferences,
  ipcMain,
  dialog,
  net,
} = require("electron");
const path = require("node:path");
const url = require("url");
const fs = require("fs");
const https = require("https");

const isDev = process.env.ELECTRON_START_URL ? true : false;

/**
 * Development Port Configuration:
 * - Dentrak Vite: 5174
 * - JBook Vite: 5173
 * - JBook API: 47832 (for Dentrak → JBook sync)
 */
const JBOOK_API_PORT = 47832;

// --- Teller Certificate Configuration ---
// Use JBook's certificates (same Teller app ID)
// JBook is at ~/Desktop/Coding/JBook, Dentrak is at ~/Desktop/Coding/Projects/dentrak
const JBOOK_CERTS_PATH = path.join(__dirname, "../../JBook/certs");
const LOCAL_CERTS_PATH = path.join(__dirname, "certs");

// Try JBook certs first, then local certs folder
let TELLER_CERT_PATH = path.join(JBOOK_CERTS_PATH, "certificate.pem");
let TELLER_KEY_PATH = path.join(JBOOK_CERTS_PATH, "private_key.pem");

// Fall back to local certs if JBook certs don't exist
if (!fs.existsSync(TELLER_CERT_PATH)) {
  TELLER_CERT_PATH = path.join(LOCAL_CERTS_PATH, "certificate.pem");
  TELLER_KEY_PATH = path.join(LOCAL_CERTS_PATH, "private_key.pem");
}

// Cache for certificate contents
let tellerCert = null;
let tellerKey = null;

/**
 * Load Teller certificates for mTLS authentication
 */
function loadTellerCertificates() {
  try {
    if (fs.existsSync(TELLER_CERT_PATH) && fs.existsSync(TELLER_KEY_PATH)) {
      tellerCert = fs.readFileSync(TELLER_CERT_PATH);
      tellerKey = fs.readFileSync(TELLER_KEY_PATH);
      console.log(
        "[Teller] Certificates loaded successfully from:",
        TELLER_CERT_PATH
      );
      return true;
    } else {
      console.log("[Teller] Certificate files not found at:", TELLER_CERT_PATH);
      console.log(
        "[Teller] Please ensure JBook is in ../JBook or add certs to ./certs folder"
      );
      return false;
    }
  } catch (error) {
    console.error("[Teller] Failed to load certificates:", error);
    return false;
  }
}

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

// --- Teller API Handlers (Main Process - with mTLS Certificate Auth) ---

/**
 * Make authenticated request to Teller API with certificate (mTLS)
 * This is required by Teller's API for security
 */
function makeTellerRequest(endpoint, accessToken) {
  return new Promise((resolve, reject) => {
    // Ensure certificates are loaded
    if (!tellerCert || !tellerKey) {
      if (!loadTellerCertificates()) {
        reject(
          new Error(
            "Teller certificates not found. Please ensure JBook certs are available or add them to ./certs folder."
          )
        );
        return;
      }
    }

    const options = {
      hostname: "api.teller.io",
      port: 443,
      path: endpoint,
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accessToken}:`).toString(
          "base64"
        )}`,
        "Content-Type": "application/json",
      },
      // Certificate-based authentication (mTLS)
      cert: tellerCert,
      key: tellerKey,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Teller API error: ${res.statusCode} - ${data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });

    req.end();
  });
}

// Get accounts for a connected bank
ipcMain.handle("teller:get-accounts", async (event, accessToken) => {
  try {
    const accounts = await makeTellerRequest("/accounts", accessToken);
    return { success: true, data: accounts };
  } catch (error) {
    console.error("[Teller] getAccounts error:", error);
    return { success: false, error: error.message };
  }
});

// Get transactions for an account
ipcMain.handle(
  "teller:get-transactions",
  async (event, accessToken, accountId, count = 100) => {
    try {
      const transactions = await makeTellerRequest(
        `/accounts/${accountId}/transactions?count=${count}`,
        accessToken
      );
      return { success: true, data: transactions };
    } catch (error) {
      console.error("[Teller] getTransactions error:", error);
      return { success: false, error: error.message };
    }
  }
);

// Get account balance
ipcMain.handle("teller:get-balance", async (event, accessToken, accountId) => {
  try {
    const balance = await makeTellerRequest(
      `/accounts/${accountId}/balances`,
      accessToken
    );
    return { success: true, data: balance };
  } catch (error) {
    console.error("[Teller] getBalance error:", error);
    return { success: false, error: error.message };
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
