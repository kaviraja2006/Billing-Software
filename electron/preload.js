const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  onGoogleAuthSuccess: (callback) => {
    ipcRenderer.removeAllListeners("google-auth-success");
    ipcRenderer.on("google-auth-success", (_, token) => callback(token));
  },

  setToken: (token) => ipcRenderer.send('set-user-token', token),



  // Window Controls
  windowControls: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
  },

  // IPC Methods (Optional if switching to HTTP, but kept for window controls and legacy)
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
  },

  // Native Features
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printReceipt: (html, options) => ipcRenderer.invoke('print-receipt', html, options),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  showAlert: (message, type) => ipcRenderer.invoke('show-alert', message, type),
  showConfirm: (message) => ipcRenderer.invoke('show-confirm', message),

  // Shell API
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell-open-external', url),
    showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path)
  },

  // PDF Generation
  generatePDF: (html, filename) => ipcRenderer.invoke('generate-pdf', { html, filename }),

  // Clipboard
  copyFileToClipboard: (filePath) => ipcRenderer.invoke('copy-file-to-clipboard', filePath)
});
