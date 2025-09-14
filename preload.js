// eslint-disable-next-line no-undef
const { contextBridge, ipcRenderer } = require("electron");

// Expose a secure API to the renderer process (your React app)
contextBridge.exposeInMainWorld("electronAPI", {
  // This function can be called from React via `window.electronAPI.promptTouchID()`
  promptTouchID: () => ipcRenderer.invoke("auth:touch-id"),
});
