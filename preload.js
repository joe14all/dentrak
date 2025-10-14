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
