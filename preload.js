/* eslint-disable no-undef */
const { contextBridge, ipcRenderer } = require("electron");

// Expose a secure API to the renderer process (your React app)
contextBridge.exposeInMainWorld("electronAPI", {
  // This function can be called from React via `window.electronAPI.promptTouchID()`
  promptTouchID: () => ipcRenderer.invoke("auth:touch-id"),

  // This function exposes the PDF saving functionality
  // It can be called from React via `window.electronAPI.savePdf()`
  savePdf: (pdfData, suggestedName) =>
    ipcRenderer.invoke("save-pdf", pdfData, suggestedName),
});

// Expose Teller API for bank integration
// These calls go through the main process to avoid CORS issues
contextBridge.exposeInMainWorld("tellerApi", {
  // Get accounts for a connected bank
  getAccounts: async (accessToken) => {
    const result = await ipcRenderer.invoke("teller:get-accounts", accessToken);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Failed to get accounts");
  },

  // Get transactions for an account
  getTransactions: async (accessToken, accountId, count = 100) => {
    const result = await ipcRenderer.invoke(
      "teller:get-transactions",
      accessToken,
      accountId,
      count
    );
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Failed to get transactions");
  },

  // Get account balance
  getBalance: async (accessToken, accountId) => {
    const result = await ipcRenderer.invoke(
      "teller:get-balance",
      accessToken,
      accountId
    );
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Failed to get balance");
  },
});
