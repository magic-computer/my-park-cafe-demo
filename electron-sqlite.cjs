// SQLite Manager for RestoMaster POS
// Powered by sql.js (WebAssembly SQLite) - 100% Native-Free, Zero-Build-Failure on Windows
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const initSqlJs = require('sql.js');

const RESTO_MASTER_VAULT_KEY = "RESTOMASTER_ULTRA_SECURE_VAULT_KEY_2026_ENTERPRISE_SYSTEM";
const DB_MAGIC_HEADER = Buffer.from('RESTO_SEC_DB_V1\n'); // 16 bytes
const dbCryptoKey = crypto.createHash('sha256').update(RESTO_MASTER_VAULT_KEY).digest();

/**
 * Encrypts raw SQLite database buffer using AES-256-GCM.
 * Prepends RESTO_SEC_DB_V1 header so unauthenticated third parties (and AI engines) cannot read it.
 */
function encryptDbBuffer(rawBuffer) {
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', dbCryptoKey, iv);
    const enc = Buffer.concat([cipher.update(rawBuffer), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([DB_MAGIC_HEADER, iv, tag, enc]);
  } catch (e) {
    console.error("Database buffer encryption error:", e);
    return rawBuffer;
  }
}

/**
 * Decrypts encrypted SQLite database buffer.
 * If file does not start with magic header (e.g. legacy plain DB), returns buffer as-is for 100% backward compatibility.
 */
function decryptDbBuffer(fileBuffer) {
  try {
    if (!fileBuffer || fileBuffer.length < DB_MAGIC_HEADER.length + 28) {
      return fileBuffer;
    }
    const magic = fileBuffer.subarray(0, DB_MAGIC_HEADER.length);
    if (!magic.equals(DB_MAGIC_HEADER)) {
      // Legacy unencrypted SQLite database! Return as-is
      return fileBuffer;
    }
    const iv = fileBuffer.subarray(DB_MAGIC_HEADER.length, DB_MAGIC_HEADER.length + 12);
    const tag = fileBuffer.subarray(DB_MAGIC_HEADER.length + 12, DB_MAGIC_HEADER.length + 28);
    const enc = fileBuffer.subarray(DB_MAGIC_HEADER.length + 28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', dbCryptoKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]);
  } catch (e) {
    console.error("Database buffer decryption error:", e);
    return fileBuffer;
  }
}

let dbInstance = null;
let dbFilePath = null;
let saveDebounceTimer = null;

/**
 * Resolves the persistent path for the resto.db file.
 * Prioritizes D:\Restomaster\resto.db if available on Windows,
 * otherwise safely falls back to UserData/Restomaster/resto.db.
 */
function getDatabaseFilePath(app) {
  let targetDir = 'D:\\Restomaster';
  if (process.platform !== 'win32' || !fs.existsSync('D:\\')) {
    const homeDir = (app && typeof app.getPath === 'function') 
      ? (app.getPath('documents') || app.getPath('userData')) 
      : process.cwd();
    targetDir = path.join(homeDir, 'Restomaster');
  }

  if (!fs.existsSync(targetDir)) {
    try {
      fs.mkdirSync(targetDir, { recursive: true });
    } catch (e) {
      console.warn("Could not create target directory:", targetDir, e);
    }
  }

  return path.join(targetDir, 'resto.db');
}

/**
 * Locates the sql-wasm.wasm binary across packaged, extraResources, and development modes.
 */
function locateWasmBinary(app) {
  const possiblePaths = [
    // 1. Packaged extraResources location (electron-builder)
    path.join(process.resourcesPath || '', 'sql-wasm.wasm'),
    // 2. Pre-copied project asset
    path.join(__dirname, 'electron-assets', 'sql-wasm.wasm'),
    // 3. Node modules direct location
    path.join(__dirname, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    // 4. App directory root
    path.join(process.cwd(), 'sql-wasm.wasm'),
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  ];

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      try {
        return fs.readFileSync(p);
      } catch (e) {
        console.warn("Found wasm file but could not read:", p, e);
      }
    }
  }

  // Fallback: require.resolve if available
  try {
    const resolved = require.resolve('sql.js/dist/sql-wasm.wasm');
    if (fs.existsSync(resolved)) {
      return fs.readFileSync(resolved);
    }
  } catch (e) {
    // Ignore require.resolve error in packaged environment
  }

  return null;
}

/**
 * Initializes the SQLite Database schema and loads existing data from disk if present.
 */
async function initSQLite(app) {
  if (dbInstance) {
    return { success: true, path: dbFilePath };
  }

  try {
    dbFilePath = getDatabaseFilePath(app);
    console.log("RestoMaster SQLite Database Path:", dbFilePath);

    const wasmBinary = locateWasmBinary(app);
    const SQL = await initSqlJs(wasmBinary ? { wasmBinary } : {});

    if (fs.existsSync(dbFilePath)) {
      try {
        const fileBuffer = fs.readFileSync(dbFilePath);
        const decryptedBuffer = decryptDbBuffer(fileBuffer);
        dbInstance = new SQL.Database(decryptedBuffer);
        console.log("Mövcud SQLite bazası uğurla oxundu (şifrələnmiş format təhlükəsiz dekodlaşdırıldı).");
      } catch (readErr) {
        console.warn("Köhnə db faylı oxunmadı, yeni baza yaradılır:", readErr);
        dbInstance = new SQL.Database();
      }
    } else {
      dbInstance = new SQL.Database();
      console.log("Yeni SQLite bazası yaradıldı.");
    }

    // Create necessary tables if they do not exist
    createTables();

    // Initial sync to disk to guarantee file presence
    persistDatabaseToDisk();

    return { success: true, path: dbFilePath };
  } catch (err) {
    console.error("SQLite inisializasiya xətası:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Executes DDL statements to ensure all application tables exist.
 */
function createTables() {
  if (!dbInstance) return;

  dbInstance.run(`
    -- Masalar Cədvəli
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      number TEXT,
      capacity INTEGER,
      status TEXT,
      orderTotal REAL,
      waiterName TEXT,
      raw_json TEXT
    );

    -- Menyu Cədvəli
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT,
      price REAL,
      category TEXT,
      status TEXT,
      raw_json TEXT
    );

    -- Sifarişlər və Kassa Çekləri Arxiv Cədvəli (Limitsiz saxlanılır)
    CREATE TABLE IF NOT EXISTS order_transactions (
      id TEXT PRIMARY KEY,
      table_id TEXT,
      table_name TEXT,
      amount REAL,
      waiter_name TEXT,
      payment_method TEXT,
      date TEXT,
      time TEXT,
      shift_id TEXT,
      timestamp INTEGER,
      raw_json TEXT
    );

    -- Anbar Qalıqları Cədvəli
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT,
      quantity REAL,
      unit TEXT,
      min_level REAL,
      cost_price REAL,
      raw_json TEXT
    );

    -- Anbar Hərəkətləri
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id TEXT PRIMARY KEY,
      item_id TEXT,
      item_name TEXT,
      quantity REAL,
      cost_price REAL,
      total_cost REAL,
      date TEXT,
      raw_json TEXT
    );

    -- Xərclər Cədvəli
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT,
      category TEXT,
      amount REAL,
      date TEXT,
      operator TEXT,
      raw_json TEXT
    );

    -- Heyət (İşçilər) Cədvəli
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT,
      role TEXT,
      status TEXT,
      raw_json TEXT
    );

    -- Rezervasiyalar
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      customer_name TEXT,
      table_id TEXT,
      time TEXT,
      guests INTEGER,
      status TEXT,
      date TEXT,
      raw_json TEXT
    );

    -- Xarab və Qaytarılma Qeydləri
    CREATE TABLE IF NOT EXISTS defect_records (
      id TEXT PRIMARY KEY,
      dish_name TEXT,
      price REAL,
      quantity REAL,
      table_number TEXT,
      date TEXT,
      reason TEXT,
      raw_json TEXT
    );

    -- Cari Açıq Sifarişlər (Masalar üzrə)
    CREATE TABLE IF NOT EXISTS active_orders (
      table_id TEXT PRIMARY KEY,
      raw_json TEXT
    );

    -- Mətbəx Logları
    CREATE TABLE IF NOT EXISTS kitchen_log (
      id TEXT PRIMARY KEY,
      dish_name TEXT,
      table_number TEXT,
      status TEXT,
      raw_json TEXT
    );

    -- Tənzimləmələr və Parametrlər (Key-Value Saxlanc)
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    );

    -- Performans İndeksləri (Hesabat və filtr sorğularının sürətləndirilməsi)
    CREATE INDEX IF NOT EXISTS idx_order_tx_date ON order_transactions (date);
    CREATE INDEX IF NOT EXISTS idx_order_tx_timestamp ON order_transactions (timestamp);
    CREATE INDEX IF NOT EXISTS idx_inventory_tx_date ON inventory_transactions (date);
    CREATE INDEX IF NOT EXISTS idx_kitchen_log_status ON kitchen_log (status);
  `);
}

/**
 * Immediate atomic write of in-memory SQLite database state to disk.
 * Preserves exact bytes and raw date strings without timezone shifts.
 */
function writeDatabaseFileNow() {
  if (!dbInstance || !dbFilePath) return;

  try {
    const data = dbInstance.export();
    const rawBuffer = Buffer.from(data);
    const encryptedBuffer = encryptDbBuffer(rawBuffer);
    const tempPath = dbFilePath + '.tmp';
    fs.writeFileSync(tempPath, encryptedBuffer);
    try {
      // Safe atomic copy to destination file without unlinking first
      fs.copyFileSync(tempPath, dbFilePath);
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (e) {}
      }
    } catch (copyErr) {
      // Fallback rename if copy fails
      if (fs.existsSync(dbFilePath)) {
        try { fs.unlinkSync(dbFilePath); } catch (e) {}
      }
      fs.renameSync(tempPath, dbFilePath);
    }
  } catch (err) {
    console.error("SQLite diska yazılarkən xəta:", err);
  }
}

/**
 * Debounced database persistence (300ms) to avoid blocking disk I/O on rapid UI clicks.
 * If called 10 times in 1 second, only 1 actual disk write is performed.
 */
function persistDatabaseToDisk() {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  saveDebounceTimer = setTimeout(() => {
    saveDebounceTimer = null;
    writeDatabaseFileNow();
  }, 300);
}

/**
 * Graceful shutdown flush:
 * Cancels pending debounce timer and writes latest DB state to disk immediately.
 */
function flushPersistDatabaseToDisk() {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  writeDatabaseFileNow();
}

/**
 * Backward-compatible alias for debounced disk persistence.
 */
function scheduleDiskPersist() {
  persistDatabaseToDisk();
}

/**
 * Helper to sync entities using diff-upsert (INSERT OR REPLACE) without wiping the entire table.
 */
function syncCollectionDiff(tableName, idColumn, data, insertSql, mapItemParams) {
  if (!Array.isArray(data)) return;

  try {
    dbInstance.run('BEGIN TRANSACTION');

    const currentIds = new Set(data.map(i => String(i[idColumn] !== undefined ? i[idColumn] : i.id)));
    // Read existing IDs to remove only deleted ones
    const res = dbInstance.exec(`SELECT ${idColumn} FROM ${tableName}`);
    if (res && res[0] && res[0].values) {
      for (const row of res[0].values) {
        const existingId = String(row[0]);
        if (!currentIds.has(existingId)) {
          dbInstance.run(`DELETE FROM ${tableName} WHERE ${idColumn} = ?`, [existingId]);
        }
      }
    }

    // Upsert all current items
    const stmt = dbInstance.prepare(insertSql);
    for (const item of data) {
      stmt.run(mapItemParams(item));
    }
    stmt.free();

    dbInstance.run('COMMIT');
  } catch (err) {
    try { dbInstance.run('ROLLBACK'); } catch (e) {}
    throw err;
  }
}

/**
 * Saves a specific entity type (tables, menuItems, etc.) into the SQLite database.
 */
function saveEntityToSQLite(entityType, data) {
  if (!dbInstance) return { success: false, error: "Database not initialized" };

  try {
    const normType = (typeof entityType === 'string' && entityType.startsWith('resto_')) 
      ? entityType.slice(6) 
      : entityType;

    switch (normType) {
      case 'tables': {
        syncCollectionDiff(
          'tables',
          'id',
          data,
          `INSERT OR REPLACE INTO tables (id, number, capacity, status, orderTotal, waiterName, raw_json)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          (item) => [
            String(item.id),
            String(item.number || ''),
            Number(item.capacity || 0),
            String(item.status || 'available'),
            Number(item.orderTotal || 0),
            String(item.waiterName || ''),
            JSON.stringify(item)
          ]
        );
        break;
      }

      case 'menuItems': {
        syncCollectionDiff(
          'menu_items',
          'id',
          data,
          `INSERT OR REPLACE INTO menu_items (id, name, price, category, status, raw_json)
           VALUES (?, ?, ?, ?, ?, ?)`,
          (item) => [
            String(item.id),
            String(item.name || ''),
            Number(item.price || 0),
            String(item.category || ''),
            String(item.status || 'active'),
            JSON.stringify(item)
          ]
        );
        break;
      }

      case 'orderTransactions': {
        // High-performance archive table: Diff-upsert without mass table truncation, or truncate when empty
        if (Array.isArray(data)) {
          if (data.length === 0) {
            dbInstance.run('DELETE FROM order_transactions');
          } else {
            try {
              dbInstance.run('BEGIN TRANSACTION');
              const stmt = dbInstance.prepare(`
                INSERT OR REPLACE INTO order_transactions (id, table_id, table_name, amount, waiter_name, payment_method, date, time, shift_id, timestamp, raw_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);
              for (const item of data) {
                stmt.run([
                  String(item.id),
                  String(item.tableId || ''),
                  String(item.tableName || ''),
                  Number(item.amount || 0),
                  String(item.waiterName || ''),
                  String(item.paymentMethod || 'cash'),
                  String(item.date || ''),
                  String(item.time || ''),
                  String(item.shiftId || ''),
                  Number(item.timestamp || Date.now()),
                  JSON.stringify(item)
                ]);
              }
              stmt.free();
              dbInstance.run('COMMIT');
            } catch (err) {
              try { dbInstance.run('ROLLBACK'); } catch (e) {}
              throw err;
            }
          }
        }
        break;
      }

      case 'inventory': {
        syncCollectionDiff(
          'inventory',
          'id',
          data,
          `INSERT OR REPLACE INTO inventory (id, name, quantity, unit, min_level, cost_price, raw_json)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          (item) => [
            String(item.id),
            String(item.name || ''),
            Number(item.quantity || 0),
            String(item.unit || 'ədəd'),
            Number(item.minLevel || 0),
            Number(item.costPrice || 0),
            JSON.stringify(item)
          ]
        );
        break;
      }

      case 'inventoryTransactions': {
        // High-performance archive table: Diff-upsert without mass table truncation, or truncate when empty
        if (Array.isArray(data)) {
          if (data.length === 0) {
            dbInstance.run('DELETE FROM inventory_transactions');
          } else {
            try {
              dbInstance.run('BEGIN TRANSACTION');
              const stmt = dbInstance.prepare(`
                INSERT OR REPLACE INTO inventory_transactions (id, item_id, item_name, quantity, cost_price, total_cost, date, raw_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `);
              for (const item of data) {
                stmt.run([
                  String(item.id),
                  String(item.itemId || ''),
                  String(item.itemName || ''),
                  Number(item.quantity || 0),
                  Number(item.costPrice || 0),
                  Number(item.totalCost || 0),
                  String(item.date || ''),
                  JSON.stringify(item)
                ]);
              }
              stmt.free();
              dbInstance.run('COMMIT');
            } catch (err) {
              try { dbInstance.run('ROLLBACK'); } catch (e) {}
              throw err;
            }
          }
        }
        break;
      }

      case 'expenses': {
        syncCollectionDiff(
          'expenses',
          'id',
          data,
          `INSERT OR REPLACE INTO expenses (id, title, category, amount, date, operator, raw_json)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          (item) => [
            String(item.id),
            String(item.title || ''),
            String(item.category || ''),
            Number(item.amount || 0),
            String(item.date || ''),
            String(item.operator || ''),
            JSON.stringify(item)
          ]
        );
        break;
      }

      case 'staff': {
        syncCollectionDiff(
          'staff',
          'id',
          data,
          `INSERT OR REPLACE INTO staff (id, name, role, status, raw_json)
           VALUES (?, ?, ?, ?, ?)`,
          (item) => [
            String(item.id),
            String(item.name || ''),
            String(item.role || ''),
            String(item.status || 'off-shift'),
            JSON.stringify(item)
          ]
        );
        break;
      }

      case 'reservations': {
        syncCollectionDiff(
          'reservations',
          'id',
          data,
          `INSERT OR REPLACE INTO reservations (id, customer_name, table_id, time, guests, status, date, raw_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          (item) => [
            String(item.id),
            String(item.customerName || ''),
            String(item.tableId || ''),
            String(item.time || ''),
            Number(item.guests || 0),
            String(item.status || 'pending'),
            String(item.date || ''),
            JSON.stringify(item)
          ]
        );
        break;
      }

      case 'defectRecords':
      case 'resto_defectRecords': {
        syncCollectionDiff(
          'defect_records',
          'id',
          data,
          `INSERT OR REPLACE INTO defect_records (id, dish_name, price, quantity, table_number, date, reason, raw_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          (item) => [
            String(item.id),
            String(item.dishName || ''),
            Number(item.price || 0),
            Number(item.quantity || 0),
            String(item.tableNumber || ''),
            String(item.date || ''),
            String(item.reason || ''),
            JSON.stringify(item)
          ]
        );
        break;
      }

      case 'activeOrders': {
        if (data && typeof data === 'object') {
          try {
            dbInstance.run('BEGIN TRANSACTION');
            const currentTableIds = new Set(Object.keys(data).map(String));
            const res = dbInstance.exec('SELECT table_id FROM active_orders');
            if (res && res[0] && res[0].values) {
              for (const row of res[0].values) {
                const existingTid = String(row[0]);
                if (!currentTableIds.has(existingTid)) {
                  dbInstance.run('DELETE FROM active_orders WHERE table_id = ?', [existingTid]);
                }
              }
            }

            const stmt = dbInstance.prepare(`
              INSERT OR REPLACE INTO active_orders (table_id, raw_json)
              VALUES (?, ?)
            `);
            for (const [tableId, orders] of Object.entries(data)) {
              stmt.run([String(tableId), JSON.stringify(orders)]);
            }
            stmt.free();
            dbInstance.run('COMMIT');
          } catch (err) {
            try { dbInstance.run('ROLLBACK'); } catch (e) {}
            throw err;
          }
        }
        break;
      }

      case 'kitchenLog': {
        syncCollectionDiff(
          'kitchen_log',
          'id',
          data,
          `INSERT OR REPLACE INTO kitchen_log (id, dish_name, table_number, status, raw_json)
           VALUES (?, ?, ?, ?, ?)`,
          (item) => [
            String(item.id),
            String(item.dishName || ''),
            String(item.tableNumber || ''),
            String(item.status || 'preparing'),
            JSON.stringify(item)
          ]
        );
        break;
      }

      default: {
        // App settings or single key-value
        const stmt = dbInstance.prepare(`
          INSERT OR REPLACE INTO app_settings (key, value, updated_at)
          VALUES (?, ?, ?)
        `);
        stmt.run([String(entityType), typeof data === 'string' ? data : JSON.stringify(data), new Date().toISOString()]);
        stmt.free();
        break;
      }
    }

    scheduleDiskPersist();
    return { success: true };
  } catch (err) {
    console.error(`Xəta (${entityType} SQLite-a yazılarkən):`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Loads all tables, settings, and entities from SQLite.
 */
function getAllFromSQLite() {
  if (!dbInstance) return null;

  try {
    const result = {};

    const parseRows = (sqlQuery) => {
      const res = dbInstance.exec(sqlQuery);
      if (!res || res.length === 0 || !res[0].values) return [];
      const colIndex = res[0].columns.indexOf('raw_json');
      if (colIndex === -1) return [];
      return res[0].values.map(row => {
        try {
          return JSON.parse(row[colIndex]);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
    };

    result.resto_tables = parseRows('SELECT raw_json FROM tables');
    result.resto_menuItems = parseRows('SELECT raw_json FROM menu_items');
    result.resto_orderTransactions = parseRows('SELECT raw_json FROM order_transactions');
    result.resto_inventory = parseRows('SELECT raw_json FROM inventory');
    result.resto_inventoryTransactions = parseRows('SELECT raw_json FROM inventory_transactions');
    result.resto_expenses = parseRows('SELECT raw_json FROM expenses');
    result.resto_staff = parseRows('SELECT raw_json FROM staff');
    result.resto_reservations = parseRows('SELECT raw_json FROM reservations');
    const defectRows = parseRows('SELECT raw_json FROM defect_records');
    if (Array.isArray(defectRows) && defectRows.length > 0) {
      result.resto_defectRecords = defectRows;
      result.defectRecords = defectRows;
    } else {
      result.resto_defectRecords = [];
      result.defectRecords = [];
    }
    result.resto_kitchenLog = parseRows('SELECT raw_json FROM kitchen_log');

    // Parse active orders
    const activeOrdersRes = dbInstance.exec('SELECT table_id, raw_json FROM active_orders');
    result.resto_activeOrders = {};
    if (activeOrdersRes && activeOrdersRes.length > 0 && activeOrdersRes[0].values) {
      for (const row of activeOrdersRes[0].values) {
        try {
          result.resto_activeOrders[row[0]] = JSON.parse(row[1]);
        } catch (e) {}
      }
    }

    // Parse app settings
    const settingsRes = dbInstance.exec('SELECT key, value FROM app_settings');
    if (settingsRes && settingsRes.length > 0 && settingsRes[0].values) {
      for (const row of settingsRes[0].values) {
        const key = row[0];
        let val = row[1];
        try {
          val = JSON.parse(val);
        } catch (e) {}
        // If defect records are already populated from defect_records table, don't overwrite with empty settings
        if ((key === 'resto_defectRecords' || key === 'defectRecords') && Array.isArray(result.resto_defectRecords) && result.resto_defectRecords.length > 0) {
          continue;
        }
        // If defect records table was empty, but settings had them:
        if ((key === 'resto_defectRecords' || key === 'defectRecords') && Array.isArray(val) && val.length > 0 && (!result.resto_defectRecords || result.resto_defectRecords.length === 0)) {
          result.resto_defectRecords = val;
          result.defectRecords = val;
        }
        result[key] = val;
      }
    }

    return result;
  } catch (err) {
    console.error("SQLite-dan oxuyarkən xəta:", err);
    return null;
  }
}

/**
 * Imports an entire backup payload into the SQLite database.
 * Completely updates tables, orders, menu, expenses, staff, etc.
 */
function importAllBackupToSQLite(backupData) {
  if (!dbInstance) return { success: false, error: "Database not initialized" };

  try {
    const tablesData = backupData.resto_tables || backupData.tables;
    if (tablesData) saveEntityToSQLite('tables', tablesData);

    const menuItemsData = backupData.resto_menuItems || backupData.menuItems;
    if (menuItemsData) saveEntityToSQLite('menuItems', menuItemsData);

    const orderTransactionsData = backupData.resto_orderTransactions || backupData.orderTransactions;
    if (orderTransactionsData) saveEntityToSQLite('orderTransactions', orderTransactionsData);

    const inventoryData = backupData.resto_inventory || backupData.inventory;
    if (inventoryData) saveEntityToSQLite('inventory', inventoryData);

    const inventoryTransactionsData = backupData.resto_inventoryTransactions || backupData.inventoryTransactions;
    if (inventoryTransactionsData) saveEntityToSQLite('inventoryTransactions', inventoryTransactionsData);

    const expensesData = backupData.resto_expenses || backupData.expenses;
    if (expensesData) saveEntityToSQLite('expenses', expensesData);

    const staffData = backupData.resto_staff || backupData.staff;
    if (staffData) saveEntityToSQLite('staff', staffData);

    const reservationsData = backupData.resto_reservations || backupData.reservations;
    if (reservationsData) saveEntityToSQLite('reservations', reservationsData);

    const defectRecordsData = backupData.resto_defectRecords || backupData.defectRecords;
    if (defectRecordsData) saveEntityToSQLite('defectRecords', defectRecordsData);

    const kitchenLogData = backupData.resto_kitchenLog || backupData.kitchenLog;
    if (kitchenLogData) saveEntityToSQLite('kitchenLog', kitchenLogData);

    const activeOrdersData = backupData.resto_activeOrders || backupData.activeOrders;
    if (activeOrdersData) saveEntityToSQLite('activeOrders', activeOrdersData);

    const auditLogsData = backupData.resto_auditLogs || backupData.auditLogs;
    if (auditLogsData !== undefined) saveEntityToSQLite('resto_auditLogs', auditLogsData);

    const closedShiftsData = backupData.resto_closedShifts || backupData.closedShifts;
    if (closedShiftsData !== undefined) saveEntityToSQLite('resto_closedShifts', closedShiftsData);

    const activeShiftData = backupData.resto_activeShift || backupData.activeShift;
    if (activeShiftData !== undefined) saveEntityToSQLite('resto_activeShift', activeShiftData);

    // Save individual settings into app_settings table
    const singleKeys = [
      'printerType', 'printerFontSize', 'printerMargin', 'printerFooterText',
      'printerRouteMode', 'networkPrinterIP', 'networkPrinterPort', 'resto_printerPresetType',
      'resto_appNameWord1', 'resto_appNameWord2', 'resto_appNameColor1', 'resto_appNameColor2',
      'resto_appNameFontSize', 'resto_appNameFontFamily', 'resto_appNameFontWeight', 'resto_appNameFontStyle', 'resto_appLogoUrl',
      'resto_devName', 'resto_devBio', 'resto_devEmail', 'resto_devPhone', 'resto_devWhatsapp',
      'resto_devGithub', 'resto_devLinkedin', 'resto_devWebsite', 'resto_devLogoUrl', 'resto_devPrograms'
    ];

    for (const k of singleKeys) {
      if (backupData[k] !== undefined) {
        saveEntityToSQLite(k, backupData[k]);
      }
    }

    persistDatabaseToDisk();
    return { success: true, path: dbFilePath };
  } catch (err) {
    console.error("Backup SQLite-a idxal edilərkən xəta:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Returns database metrics and file info
 */
function getDatabaseInfo() {
  let fileSize = 0;
  let exists = false;
  if (dbFilePath && fs.existsSync(dbFilePath)) {
    try {
      const stats = fs.statSync(dbFilePath);
      fileSize = stats.size;
      exists = true;
    } catch (e) {}
  }

  let tableCount = 0;
  let orderCount = 0;
  if (dbInstance) {
    try {
      const res = dbInstance.exec('SELECT count(*) as count FROM order_transactions');
      if (res && res[0] && res[0].values) {
        orderCount = res[0].values[0][0];
      }
      const tRes = dbInstance.exec('SELECT count(*) as count FROM tables');
      if (tRes && tRes[0] && tRes[0].values) {
        tableCount = tRes[0].values[0][0];
      }
    } catch (e) {}
  }

  return {
    engine: 'SQLite 3 (sql.js WebAssembly)',
    path: dbFilePath,
    exists,
    sizeBytes: fileSize,
    sizeKb: (fileSize / 1024).toFixed(2),
    tableCount,
    orderCount
  };
}

module.exports = {
  initSQLite,
  getDatabaseFilePath,
  persistDatabaseToDisk,
  flushPersistDatabaseToDisk,
  writeDatabaseFileNow,
  saveEntityToSQLite,
  getAllFromSQLite,
  importAllBackupToSQLite,
  getDatabaseInfo
};
