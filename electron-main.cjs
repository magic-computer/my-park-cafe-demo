const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sqliteManager = require('./electron-sqlite.cjs');

let mainWindow;

// Handle silent printing via offscreen worker window
ipcMain.on('print', (event, { html, deviceName, copies }) => {
  let workerWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Failsafe timeout to prevent workerWindow memory leak if print spooler hangs
  const printTimeout = setTimeout(() => {
    if (workerWindow && !workerWindow.isDestroyed()) {
      console.warn(`Print operation timed out for device "${deviceName}", destroying worker.`);
      try {
        event.reply('print-status-response', {
          success: false,
          deviceName: deviceName || '',
          errorType: 'PrintTimeoutError'
        });
      } catch (e) {}
      workerWindow.destroy();
      workerWindow = null;
    }
  }, 10000);

  workerWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  workerWindow.webContents.on('did-fail-load', (errEvent, errorCode, errorDescription) => {
    clearTimeout(printTimeout);
    console.error(`Worker window failed to load HTML for printing: ${errorDescription} (${errorCode})`);
    try {
      event.reply('print-status-response', {
        success: false,
        deviceName: deviceName || '',
        errorType: `LoadFailed: ${errorDescription} (${errorCode})`
      });
    } catch (e) {}
    if (workerWindow && !workerWindow.isDestroyed()) {
      workerWindow.destroy();
      workerWindow = null;
    }
  });

  workerWindow.webContents.on('did-finish-load', () => {
    workerWindow.webContents.print({
      silent: true,
      printBackground: true,
      deviceName: deviceName || '',
      copies: copies || 1
    }, (success, errorType) => {
      clearTimeout(printTimeout);
      if (!success) {
        console.error(`Direct silent print failed for device "${deviceName}":`, errorType);
        try {
          event.reply('print-status-response', {
            success: false,
            deviceName: deviceName || '',
            errorType: errorType || 'PrintFailed'
          });
        } catch (e) {}
      } else {
        try {
          event.reply('print-status-response', {
            success: true,
            deviceName: deviceName || ''
          });
        } catch (e) {}
      }
      if (workerWindow && !workerWindow.isDestroyed()) {
        workerWindow.destroy();
        workerWindow = null;
      }
    });
  });
});

// Handle retrieving native system printers
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers.map(p => p.name);
  } catch (err) {
    console.error("Failed to fetch system printers list:", err);
    return [];
  }
});

// Handle retrieving detailed printers with portName
ipcMain.handle('get-printers-detailed', async () => {
  if (!mainWindow) return [];
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers.map(p => ({
      name: p.name,
      displayName: p.displayName || p.name,
      description: p.description || '',
      isDefault: p.isDefault,
      portName: (p.options && p.options.portName) ? p.options.portName : (p.portName || '')
    }));
  } catch (err) {
    console.error("Failed to fetch detailed system printers:", err);
    return [];
  }
});

// Handle dynamic main window title updating
ipcMain.on('update-title', (event, title) => {
  if (mainWindow) {
    mainWindow.setTitle(title);
  }
});

// Desktop local file storage handlers (for automatic persistence across Electron restarts)
ipcMain.handle('save-desktop-data', async (event, data) => {
  try {
    const dataFilePath = path.join(app.getPath('userData'), 'resto_desktop_data.json');
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    console.error("Desktop save failed:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('load-desktop-data', async () => {
  try {
    const dataFilePath = path.join(app.getPath('userData'), 'resto_desktop_data.json');
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf-8');
      return JSON.parse(content);
    }
    return null;
  } catch (err) {
    console.error("Desktop load failed:", err);
    return null;
  }
});

// --- SQLite Database IPC Handlers ---
ipcMain.handle('sqlite:init', async () => {
  try {
    return await sqliteManager.initSQLite(app);
  } catch (err) {
    console.error("SQLite IPC init error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('sqlite:get-all', async () => {
  try {
    return sqliteManager.getAllFromSQLite();
  } catch (err) {
    console.error("SQLite IPC get-all error:", err);
    return null;
  }
});

ipcMain.handle('sqlite:save-entity', async (event, { entityType, data }) => {
  try {
    return sqliteManager.saveEntityToSQLite(entityType, data);
  } catch (err) {
    console.error("SQLite IPC save-entity error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('sqlite:import-all', async (event, fullBackupData) => {
  try {
    return sqliteManager.importAllBackupToSQLite(fullBackupData);
  } catch (err) {
    console.error("SQLite IPC import-all error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('sqlite:get-info', async () => {
  try {
    return sqliteManager.getDatabaseInfo();
  } catch (err) {
    return { engine: 'SQLite', exists: false, error: err.message };
  }
});

// --- Secure Authentication IPC Handlers (crypto.scrypt salt+hash) ---
function getAuthVaultPath() {
  return path.join(app.getPath('userData'), 'resto_auth_vault.json');
}

function computePasswordHash(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString('hex');
}

function loadAuthVault() {
  const vaultPath = getAuthVaultPath();
  let vault = null;
  if (fs.existsSync(vaultPath)) {
    try {
      vault = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
    } catch (e) {
      console.warn("Auth vault oxunmadı, yenidən yaradılır:", e);
    }
  }

  if (!vault || typeof vault !== 'object') {
    vault = {};
  }

  // Ensure default hashed credentials exist if not previously set
  if (!vault.admin) {
    const salt = crypto.randomBytes(16).toString('hex');
    vault.admin = {
      salt,
      hash: computePasswordHash('admin', salt)
    };
  }
  if (!vault.startup) {
    const salt = crypto.randomBytes(16).toString('hex');
    vault.startup = {
      salt,
      hash: computePasswordHash('1234', salt)
    };
  }
  if (!vault.management) {
    const salt = crypto.randomBytes(16).toString('hex');
    vault.management = {
      salt,
      hash: computePasswordHash('0000', salt)
    };
  } else if (!vault.management_customized) {
    // If management password was previously created with old default '1234', update default to '0000'
    const old1234Hash = computePasswordHash('1234', vault.management.salt);
    if (vault.management.hash === old1234Hash) {
      const salt = crypto.randomBytes(16).toString('hex');
      vault.management = {
        salt,
        hash: computePasswordHash('0000', salt)
      };
      saveAuthVault(vault);
    }
  }

  return vault;
}

function saveAuthVault(vault) {
  try {
    const vaultPath = getAuthVaultPath();
    fs.writeFileSync(vaultPath, JSON.stringify(vault, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Auth vault diska yazılarkən xəta:", err);
    return false;
  }
}

ipcMain.handle('auth:verify-admin', async (event, args) => {
  try {
    const password = typeof args === 'object' && args !== null ? args.password : args;
    const type = (typeof args === 'object' && args !== null && args.type) ? args.type : 'admin';
    if (!password) return { success: false };

    const vault = loadAuthVault();
    const entry = vault[type] || (type === 'startup' ? vault.startup : (type === 'management' ? vault.management : vault.admin));
    if (!entry || !entry.salt || !entry.hash) return { success: false };

    const calculatedHash = computePasswordHash(password, entry.salt);
    const bufA = Buffer.from(calculatedHash, 'hex');
    const bufB = Buffer.from(entry.hash, 'hex');

    const match = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
    return { success: match };
  } catch (err) {
    console.error("auth:verify-admin error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('auth:set-admin-password', async (event, args) => {
  try {
    const newPassword = typeof args === 'object' && args !== null ? args.newPassword : args;
    const type = (typeof args === 'object' && args !== null && args.type) ? args.type : 'admin';
    if (!newPassword || String(newPassword).length < 1) {
      return { success: false, error: "Şifrə boş ola bilməz" };
    }

    const vault = loadAuthVault();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = computePasswordHash(newPassword, salt);
    vault[type] = { salt, hash };
    vault[`${type}_customized`] = true;
    saveAuthVault(vault);

    return { success: true };
  } catch (err) {
    console.error("auth:set-admin-password error:", err);
    return { success: false, error: err.message };
  }
});

// --- Enterprise Cryptographic Vault for Backup Files (AES-256-GCM) ---
const RESTO_MASTER_VAULT_KEY = "RESTOMASTER_ULTRA_SECURE_VAULT_KEY_2026_ENTERPRISE_SYSTEM";

function isEncryptedBackupString(str) {
  if (!str || typeof str !== 'string') return false;
  return str.includes('"_resto_vault"') && str.includes('RESTO_AES_GCM_V1');
}

function encryptBackupString(plainStr) {
  try {
    const key = crypto.createHash('sha256').update(RESTO_MASTER_VAULT_KEY).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let enc = cipher.update(plainStr, 'utf8', 'hex');
    enc += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return JSON.stringify({
      _resto_vault: "RESTO_AES_GCM_V1",
      _system: "RestoMaster POS Encrypted Cloud ERP",
      _encryption: "AES-256-GCM 256-Bit Military Grade",
      backup_timestamp: new Date().toISOString(),
      iv: iv.toString('hex'),
      data: enc,
      tag: tag.toString('hex')
    }, null, 2);
  } catch (err) {
    console.error("electron encryptBackupString error:", err);
    return plainStr;
  }
}

function decryptBackupString(cipherStr) {
  try {
    const parsed = typeof cipherStr === 'string' ? JSON.parse(cipherStr) : cipherStr;
    if (!parsed || parsed._resto_vault !== 'RESTO_AES_GCM_V1' || !parsed.data || !parsed.iv || !parsed.tag) {
      return cipherStr; // Legacy unencrypted string
    }
    const key = crypto.createHash('sha256').update(RESTO_MASTER_VAULT_KEY).digest();
    const iv = Buffer.from(parsed.iv, 'hex');
    const tag = Buffer.from(parsed.tag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let dec = decipher.update(parsed.data, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch (err) {
    console.error("electron decryptBackupString error:", err);
    return cipherStr;
  }
}

ipcMain.handle('crypto:encrypt-backup', async (event, plainText) => {
  return encryptBackupString(plainText);
});

ipcMain.handle('crypto:decrypt-backup', async (event, cipherText) => {
  return decryptBackupString(cipherText);
});

// High-speed, non-blocking background D:\Restomaster backup & app quit handler
ipcMain.handle('backup-and-exit', async (event, backupJsonString) => {
  try {
    // 1. Primary target folder: D:\Restomaster (or fallback to UserData/Restomaster if on non-Windows/no D drive)
    let targetDir = 'D:\\Restomaster';
    if (process.platform !== 'win32' || !fs.existsSync('D:\\')) {
      // If running on a system without direct D:\ (or Linux/Mac/test environment), use safe application root/documents folder
      const homeDir = app.getPath('documents') || app.getPath('userData');
      targetDir = path.join(homeDir, 'Restomaster');
    }

    // Ensure the folder exists without error
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const backupFilePath = path.join(targetDir, 'RestoMaster_Backup.json');
    const tempBackupFilePath = path.join(targetDir, 'RestoMaster_Backup.tmp');

    // Ensure written backup is always securely encrypted (AES-256-GCM)
    let stringToWrite = backupJsonString;
    if (!isEncryptedBackupString(backupJsonString)) {
      stringToWrite = encryptBackupString(backupJsonString);
    }

    // Asynchronous atomic write: write to temp file first, then atomically overwrite the old backup file
    await fs.promises.writeFile(tempBackupFilePath, stringToWrite, 'utf-8');
    if (fs.existsSync(backupFilePath)) {
      try {
        await fs.promises.unlink(backupFilePath);
      } catch (e) {
        // Safe overwrite fallback
      }
    }
    await fs.promises.rename(tempBackupFilePath, backupFilePath);

    // Also persist a copy into userData for failsafe redundancy
    try {
      const internalUserDataBackup = path.join(app.getPath('userData'), 'RestoMaster_Backup.json');
      await fs.promises.writeFile(internalUserDataBackup, stringToWrite, 'utf-8');
    } catch (e) {
      // Non-blocking secondary copy
    }

    // Ensure SQLite in-memory database is immediately flushed to disk
    try {
      sqliteManager.persistDatabaseToDisk();
    } catch (e) {
      console.error("backup-and-exit persistDatabaseToDisk error:", e);
    }

    // Safely exit the desktop application after completion
    setTimeout(() => {
      app.quit();
    }, 150);

    return { success: true, path: backupFilePath };
  } catch (err) {
    console.error("D:\\Restomaster backup error:", err);
    // Even in case of file system permission anomalies, ensure application closes cleanly
    setTimeout(() => {
      app.quit();
    }, 300);
    return { success: false, error: err.message };
  }
});

// Explicit quit application IPC handler
ipcMain.on('quit-app', () => {
  try {
    sqliteManager.persistDatabaseToDisk();
  } catch (err) {
    console.error("quit-app persistDatabaseToDisk xətası:", err);
  }
  app.quit();
});

function createWindow() {
  // Determine window icon path (development and production fallbacks)
  let iconPath = path.join(__dirname, 'public', 'icon.png');
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, 'dist', 'icon.png');
  }

  // Create the browser window optimized for desktops and POS monitors
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    useContentSize: true,
    autoHideMenuBar: true, // Hides the classic desktop file menu bar for a clean, modern look
    title: "RESTO MASTER - Restoran İdarəetmə Sistemi",
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'electron-preload.cjs')
    }
  });

  // Hides the default menu entirely
  Menu.setApplicationMenu(null);

  // Load the built index.html from Vite
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  mainWindow.loadFile(indexPath).catch(err => {
    console.error("Fayl yüklənə bilmədi:", err);
  });

  // Maximize the window automatically for POS terminals to utilize full touch screens
  mainWindow.maximize();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await sqliteManager.initSQLite(app);
  } catch (dbErr) {
    console.warn("SQLite pre-initialization notice:", dbErr);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  try {
    sqliteManager.flushPersistDatabaseToDisk();
  } catch (err) {
    console.error("window-all-closed flushPersistDatabaseToDisk xətası:", err);
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  try {
    sqliteManager.flushPersistDatabaseToDisk();
  } catch (err) {
    console.error("before-quit flushPersistDatabaseToDisk xətası:", err);
  }
});
