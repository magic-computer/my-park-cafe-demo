const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  console.log('RestoMaster Desktop POS Shell initialized successfully.');
});

contextBridge.exposeInMainWorld('electron', {
  print: (options) => ipcRenderer.send('print', options),
  onPrintStatus: (callback) => {
    const listener = (event, status) => callback(status);
    ipcRenderer.on('print-status-response', listener);
    return () => ipcRenderer.removeListener('print-status-response', listener);
  },
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  getPrintersDetailed: () => ipcRenderer.invoke('get-printers-detailed'),
  updateTitle: (title) => ipcRenderer.send('update-title', title),
  saveDesktopData: (data) => ipcRenderer.invoke('save-desktop-data', data),
  loadDesktopData: () => ipcRenderer.invoke('load-desktop-data'),
  backupAndExit: (backupJsonString) => ipcRenderer.invoke('backup-and-exit', backupJsonString),
  quitApp: () => ipcRenderer.send('quit-app'),
  // SQLite Database IPC methods
  sqliteInit: () => ipcRenderer.invoke('sqlite:init'),
  sqliteGetAll: () => ipcRenderer.invoke('sqlite:get-all'),
  sqliteSaveEntity: (entityType, data) => ipcRenderer.invoke('sqlite:save-entity', { entityType, data }),
  sqliteImportAll: (fullBackupData) => ipcRenderer.invoke('sqlite:import-all', fullBackupData),
  sqliteGetDbInfo: () => ipcRenderer.invoke('sqlite:get-info'),
  // Secure Authentication IPC methods
  authVerifyAdmin: (password, type = 'admin') => ipcRenderer.invoke('auth:verify-admin', { password, type }),
  authSetAdminPassword: (newPassword, type = 'admin') => ipcRenderer.invoke('auth:set-admin-password', { newPassword, type }),
  // Cryptographic Vault IPC methods
  cryptoEncryptBackup: (plainText) => ipcRenderer.invoke('crypto:encrypt-backup', plainText),
  cryptoDecryptBackup: (cipherText) => ipcRenderer.invoke('crypto:decrypt-backup', cipherText)
});
