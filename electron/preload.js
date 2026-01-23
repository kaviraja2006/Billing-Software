const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    onGoogleAuthSuccess: (callback) =>
        ipcRenderer.on("google-auth-success", (event, token) => callback(token)),
});

contextBridge.exposeInMainWorld("electron", {
  invoice: {
    create: (data) => ipcRenderer.invoke('invoice:create', data),
    findAll: (query) => ipcRenderer.invoke('invoice:findAll', query),
    findById: (id) => ipcRenderer.invoke('invoice:findById', id),
    update: (id, data) => ipcRenderer.invoke('invoice:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('invoice:delete', id),
  },
  customer: {
    create: (data) => ipcRenderer.invoke('customer:create', data),
    findAll: (query) => ipcRenderer.invoke('customer:findAll', query),
    findById: (id) => ipcRenderer.invoke('customer:findById', id),
    update: (id, data) => ipcRenderer.invoke('customer:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('customer:delete', id),
  },
  product: {
    create: (data) => ipcRenderer.invoke('product:create', data),
    findAll: (query) => ipcRenderer.invoke('product:findAll', query),
    findById: (id) => ipcRenderer.invoke('product:findById', id),
    update: (id, data) => ipcRenderer.invoke('product:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('product:delete', id),
  },
  settings: {
    getSettings: () => ipcRenderer.invoke('settings:get'),
    updateSettings: (data) => ipcRenderer.invoke('settings:update', data),
  }
});
