// Secure authentication helpers using Electron main IPC (crypto.scrypt) with Web Crypto fallback
export async function sha256Web(str: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(str));
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Dynamic Session Salt: Generates a secure, ephemeral 256-bit cryptographic salt per session
function getSessionSalt(): string {
  let salt = sessionStorage.getItem('resto_sec_entropy');
  if (!salt) {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    salt = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('resto_sec_entropy', salt);
  }
  return salt;
}

export type AuthType = 'admin' | 'management' | 'startup' | 'inventory';

export async function createSessionToken(type: AuthType): Promise<string> {
  const timestamp = Date.now();
  const payload = `${type}:${timestamp}:${getSessionSalt()}`;
  const sig = await sha256Web(payload);
  const tokenObj = { type, timestamp, sig };
  const encoded = btoa(JSON.stringify(tokenObj));
  sessionStorage.setItem(`resto_session_${type}`, encoded);
  return encoded;
}

export async function verifySessionToken(type: AuthType): Promise<boolean> {
  try {
    const raw = sessionStorage.getItem(`resto_session_${type}`);
    if (!raw) return false;
    const tokenObj = JSON.parse(atob(raw));
    if (!tokenObj || tokenObj.type !== type || !tokenObj.timestamp || !tokenObj.sig) {
      return false;
    }
    // Token validity: max 12 hours
    const ageMs = Date.now() - tokenObj.timestamp;
    if (ageMs > 12 * 60 * 60 * 1000 || ageMs < -60000) {
      sessionStorage.removeItem(`resto_session_${type}`);
      return false;
    }
    const expectedPayload = `${type}:${tokenObj.timestamp}:${getSessionSalt()}`;
    const expectedSig = await sha256Web(expectedPayload);
    return tokenObj.sig === expectedSig;
  } catch (e) {
    return false;
  }
}

export function clearSessionToken(type: AuthType): void {
  sessionStorage.removeItem(`resto_session_${type}`);
}

export async function verifyPasswordSecure(password: string, type: AuthType = 'admin'): Promise<boolean> {
  if ((window as any).electron?.authVerifyAdmin) {
    try {
      const res = await (window as any).electron.authVerifyAdmin(password, type);
      const ok = typeof res === 'object' && res !== null ? !!res.success : !!res;
      if (ok) await createSessionToken(type);
      return ok;
    } catch (err) {
      console.error("IPC auth verify error:", err);
      return false;
    }
  }

  // Web/Browser fallback: uses SHA-256 hash instead of plain text
  try {
    const key = type === 'admin' 
      ? 'resto_admin_hash' 
      : type === 'startup' 
        ? 'resto_startup_hash' 
        : type === 'inventory'
          ? 'resto_inventory_hash'
          : 'resto_mgmt_hash';
    const customizedKey = `${key}_customized`;
    const isCustomized = localStorage.getItem(customizedKey) === 'true';

    let savedHash = localStorage.getItem(key);
    if (!savedHash || !isCustomized) {
      const defaultPlain = type === 'admin' 
        ? 'admin' 
        : type === 'startup' 
          ? '1234' 
          : type === 'inventory'
            ? 'anbar'
            : '0000';
      if (!isCustomized) {
        savedHash = await sha256Web(defaultPlain);
        localStorage.setItem(key, savedHash);
      }
    }
    const computed = await sha256Web(password);
    const ok = (computed === savedHash);
    if (ok) {
      await createSessionToken(type);
    }
    return ok;
  } catch (e) {
    return false;
  }
}

export async function setPasswordSecure(newPassword: string, type: AuthType = 'admin'): Promise<boolean> {
  if ((window as any).electron?.authSetAdminPassword) {
    try {
      const res = await (window as any).electron.authSetAdminPassword(newPassword, type);
      return typeof res === 'object' && res !== null ? !!res.success : !!res;
    } catch (err) {
      console.error("IPC auth set error:", err);
      return false;
    }
  }

  // Web/Browser fallback
  try {
    const key = type === 'admin' 
      ? 'resto_admin_hash' 
      : type === 'startup' 
        ? 'resto_startup_hash' 
        : type === 'inventory'
          ? 'resto_inventory_hash'
          : 'resto_mgmt_hash';
    const computed = await sha256Web(newPassword);
    localStorage.setItem(key, computed);
    localStorage.setItem(`${key}_customized`, 'true');
    return true;
  } catch (e) {
    return false;
  }
}

export async function migrateLegacyPasswords(): Promise<void> {
  try {
    const legacyAdmin = localStorage.getItem('resto_adminPassword');
    if (legacyAdmin) {
      await setPasswordSecure(legacyAdmin, 'admin');
      localStorage.removeItem('resto_adminPassword');
    }
    const legacyMgmt = localStorage.getItem('management_password');
    if (legacyMgmt) {
      if (legacyMgmt !== '1234' && legacyMgmt !== '0000') {
        await setPasswordSecure(legacyMgmt, 'management');
      }
      localStorage.removeItem('management_password');
    }
  } catch (e) {
    console.warn("Legacy password migration notice:", e);
  }
}

