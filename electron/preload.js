const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAuth", {
  onToken: (callback) => {
    ipcRenderer.on("auth-token", (_, token) => callback(token));
  },
});
