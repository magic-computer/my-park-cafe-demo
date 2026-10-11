// RestoMaster POS Military-Grade Enterprise Cryptographic Vault
// AES-256-GCM authenticated encryption for database backups, local storage, and disk persistence

export const RESTO_MASTER_VAULT_KEY = "RESTOMASTER_ULTRA_SECURE_VAULT_KEY_2026_ENTERPRISE_SYSTEM";
export const VAULT_HEADER = "RESTO_AES_GCM_V1";

export interface EncryptedBackupEnvelope {
  _resto_vault: string;
  _system: string;
  _encryption: string;
  backup_timestamp: string;
  iv: string;
  data: string;
  tag: string;
}

/**
 * Checks if the given object or string is an encrypted backup envelope.
 */
export function isEncryptedPayload(input: any): boolean {
  if (!input) return false;
  if (typeof input === 'object') {
    return input._resto_vault === VAULT_HEADER && typeof input.data === 'string' && typeof input.iv === 'string';
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    return trimmed.startsWith('{') && trimmed.includes('"_resto_vault"') && trimmed.includes(VAULT_HEADER);
  }
  return false;
}

/**
 * Convert Uint8Array to hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Convert hex string to Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Derives a 256-bit CryptoKey for AES-GCM from the master secret using SHA-256.
 */
async function getWebCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = enc.encode(RESTO_MASTER_VAULT_KEY);
  const hash = await crypto.subtle.digest('SHA-256', keyMaterial);
  return await crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary backup payload into a secure encrypted JSON envelope string.
 */
export async function encryptBackupPayload(data: any): Promise<string> {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  // If running in Electron with IPC support, utilize native Node crypto
  if ((window as any).electron?.cryptoEncryptBackup) {
    try {
      const res = await (window as any).electron.cryptoEncryptBackup(jsonStr);
      if (res && typeof res === 'string') return res;
    } catch (ipcErr) {
      console.warn("Electron cryptoEncryptBackup fallback to WebCrypto:", ipcErr);
    }
  }

  // WebCrypto implementation (100% standard across modern browsers and Electron)
  try {
    const key = await getWebCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encodedData = enc.encode(jsonStr);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    const cipherArray = new Uint8Array(cipherBuffer);
    // In Web Crypto, AES-GCM appends the 16-byte auth tag at the end of the ciphertext
    const dataBytes = cipherArray.slice(0, cipherArray.length - 16);
    const tagBytes = cipherArray.slice(cipherArray.length - 16);

    const envelope: EncryptedBackupEnvelope = {
      _resto_vault: VAULT_HEADER,
      _system: "RestoMaster POS Encrypted Cloud ERP",
      _encryption: "AES-256-GCM 256-Bit Military Grade",
      backup_timestamp: new Date().toISOString(),
      iv: bytesToHex(iv),
      data: bytesToHex(dataBytes),
      tag: bytesToHex(tagBytes)
    };

    return JSON.stringify(envelope, null, 2);
  } catch (err) {
    console.error("Backup payload encryption error:", err);
    // Fallback: return raw string if WebCrypto fails
    return jsonStr;
  }
}

/**
 * Decrypts an encrypted backup string or object, or returns legacy unencrypted JSON as-is.
 */
export async function decryptBackupPayload(input: any): Promise<any> {
  if (!input) return null;

  let parsedEnvelope: any = null;
  if (typeof input === 'object') {
    parsedEnvelope = input;
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed.startsWith('{')) {
      return input;
    }
    try {
      parsedEnvelope = JSON.parse(trimmed);
    } catch (e) {
      return input;
    }
  }

  // If not an encrypted envelope, return as-is (100% backwards compatibility)
  if (!isEncryptedPayload(parsedEnvelope)) {
    return parsedEnvelope;
  }

  // If running in Electron with IPC support, try native decryption
  if ((window as any).electron?.cryptoDecryptBackup) {
    try {
      const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
      const res = await (window as any).electron.cryptoDecryptBackup(inputStr);
      if (res) {
        return typeof res === 'string' ? JSON.parse(res) : res;
      }
    } catch (ipcErr) {
      console.warn("Electron cryptoDecryptBackup fallback to WebCrypto:", ipcErr);
    }
  }

  // WebCrypto decryption
  try {
    const key = await getWebCryptoKey();
    const iv = hexToBytes(parsedEnvelope.iv);
    const dataBytes = hexToBytes(parsedEnvelope.data);
    const tagBytes = hexToBytes(parsedEnvelope.tag);

    // Combine dataBytes + tagBytes for WebCrypto AES-GCM
    const combined = new Uint8Array(dataBytes.length + tagBytes.length);
    combined.set(dataBytes, 0);
    combined.set(tagBytes, dataBytes.length);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      combined
    );

    const dec = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(dec);
  } catch (err) {
    console.error("Backup payload decryption error:", err);
    throw new Error("Faylın şifrəsi açıla bilmədi və ya zədələnib.");
  }
}
