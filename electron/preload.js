const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    onGoogleAuthSuccess: (callback) =>
        ipcRenderer.on("google-auth-success", (event, token) => callback(token)),
});
