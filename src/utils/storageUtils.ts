/**
 * Safe localStorage wrapper with comprehensive auto-pruning failsafes for RestoMaster POS.
 * Prevents QuotaExceededError crashes when transaction history, logs, or shift archives grow large over time.
 */
export const safeLocalStorageSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`LocalStorage yazma xətası [${key}]:`, error);
    if (
      error instanceof DOMException && (
        error.code === 22 || 
        error.code === 1014 || 
        error.name === 'QuotaExceededError' || 
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )
    ) {
      try {
        // 1. Direct key pruning - Keep newest items (index 0 is newest)
        if (key === 'resto_orderTransactions') {
          const currentList = JSON.parse(value);
          if (Array.isArray(currentList) && currentList.length > 500) {
            const pruned = currentList.slice(0, 500);
            localStorage.setItem(key, JSON.stringify(pruned));
            console.warn('LocalStorage limitini aşmamaq üçün ən köhnə sifariş tranzaksiyaları avtomatik təmizləndi (son 500 saxlanıldı).');
            return;
          }
        }
        if (key === 'resto_inventoryTransactions') {
          const currentList = JSON.parse(value);
          if (Array.isArray(currentList) && currentList.length > 300) {
            const pruned = currentList.slice(0, 300);
            localStorage.setItem(key, JSON.stringify(pruned));
            console.warn('LocalStorage limitini aşmamaq üçün ən köhnə anbar hərəkətləri təmizləndi (son 300 saxlanıldı).');
            return;
          }
        }
        if (key === 'resto_auditLogs') {
          const currentList = JSON.parse(value);
          if (Array.isArray(currentList) && currentList.length > 200) {
            const pruned = currentList.slice(0, 200);
            localStorage.setItem(key, JSON.stringify(pruned));
            console.warn('LocalStorage limitini aşmamaq üçün ən köhnə audit logları təmizləndi (son 200 saxlanıldı).');
            return;
          }
        }
        if (key === 'resto_kitchenLog') {
          const currentList = JSON.parse(value);
          if (Array.isArray(currentList) && currentList.length > 200) {
            const pruned = currentList.slice(0, 200);
            localStorage.setItem(key, JSON.stringify(pruned));
            console.warn('LocalStorage limitini aşmamaq üçün ən köhnə mətbəx qeydləri təmizləndi (son 200 saxlanıldı).');
            return;
          }
        }
        if (key === 'resto_expenses') {
          const currentList = JSON.parse(value);
          if (Array.isArray(currentList) && currentList.length > 400) {
            const pruned = currentList.slice(0, 400);
            localStorage.setItem(key, JSON.stringify(pruned));
            console.warn('LocalStorage limitini aşmamaq üçün ən köhnə xərc qeydləri təmizləndi (son 400 saxlanıldı).');
            return;
          }
        }
        if (key === 'resto_defectRecords') {
          const currentList = JSON.parse(value);
          if (Array.isArray(currentList) && currentList.length > 300) {
            const pruned = currentList.slice(0, 300);
            localStorage.setItem(key, JSON.stringify(pruned));
            console.warn('LocalStorage limitini aşmamaq üçün ən köhnə defekt qeydləri təmizləndi (son 300 saxlanıldı).');
            return;
          }
        }
        if (key === 'resto_reservations') {
          const currentList = JSON.parse(value);
          if (Array.isArray(currentList) && currentList.length > 200) {
            const pruned = currentList.slice(0, 200);
            localStorage.setItem(key, JSON.stringify(pruned));
            console.warn('LocalStorage limitini aşmamaq üçün ən köhnə rezervasiyalar təmizləndi (son 200 saxlanıldı).');
            return;
          }
        }
        if (key === 'resto_closedShifts') {
          const shiftsObj = JSON.parse(value);
          if (shiftsObj && typeof shiftsObj === 'object') {
            const keys = Object.keys(shiftsObj).sort();
            if (keys.length > 60) {
              const recentKeys = keys.slice(-60);
              const pruned: Record<string, any> = {};
              recentKeys.forEach(k => { pruned[k] = shiftsObj[k]; });
              localStorage.setItem(key, JSON.stringify(pruned));
              console.warn('LocalStorage limitini aşmamaq üçün köhnə növbə snapshotları təmizləndi (son 60 saxlanıldı, SQLite tam arxivdədir).');
              return;
            }
          }
        }

        // 2. Emergency general pruning across other storage keys to make space (keeping newest records at index 0)
        const emergencyKeys = ['resto_auditLogs', 'resto_kitchenLog', 'resto_inventoryTransactions', 'resto_orderTransactions', 'resto_defectRecords', 'resto_reservations'];
        for (const eKey of emergencyKeys) {
          if (eKey !== key) {
            const existing = localStorage.getItem(eKey);
            if (existing) {
              try {
                const arr = JSON.parse(existing);
                if (Array.isArray(arr) && arr.length > 100) {
                  localStorage.setItem(eKey, JSON.stringify(arr.slice(0, 100)));
                }
              } catch (e) {}
            }
          }
        }

        // Retry saving current key once after emergency pruning
        localStorage.setItem(key, value);
      } catch (innerError) {
        console.error(`Məlumatları ixtisar edərkən və ya təkrar yazarkən xəta yarandı [${key}]:`, innerError);
      }
    }
  }
};
