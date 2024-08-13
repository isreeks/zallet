// packages/keyStore/src/keyStore.ts

const SALT_SIZE = 16;
const IV_SIZE = 12; // GCM typically uses a 12-byte IV
const KEY_SIZE = 256;
const ITERATIONS = 100000;

let dbCache: IDBDatabase | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (dbCache) {
    return Promise.resolve(dbCache);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cryptoKeyDB', 1);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'id' });
      }
    };

    request.onsuccess = event => {
      dbCache = (event.target as IDBOpenDBRequest).result;
      resolve(dbCache);
    };

    request.onerror = event => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// Store a key in IndexedDB
export const storeKey = async (id: string, key: any, password: string): Promise<void> => {
  const keyData = JSON.stringify(key); // Convert key to JSON
  const encryptedKey = await encryptData(password, keyData);

  return new Promise<void>((resolve, reject) => {
    openDb()
      .then(db => {
        const transaction = db.transaction(['keys'], 'readwrite');
        const store = transaction.objectStore('keys');

        const request = store.put({ id, encryptedKey });

        request.onerror = () => {
          reject(request.error);
        };

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = () => {
          reject(transaction.error);
        };
      })
      .catch(reject);
  });
};

// Retrieve a key from IndexedDB
export const retrieveKey = async (id: string, password: string | null): Promise<any | null> => {
  return new Promise((resolve, reject) => {
    openDb()
      .then(db => {
        const transaction = db.transaction(['keys'], 'readonly');
        const store = transaction.objectStore('keys');
        const request = store.get(id);

        request.onerror = () => {
          reject(request.error);

          if (password === null) {
            resolve(false);
          }
        };

        request.onsuccess = async () => {
          if (password === null && request.result?.encryptedKey.length > 1) {
            return resolve(true);
          } else if (password === null && request.result?.encryptedKey.length) {
            return resolve(false);
          }

          const encryptedKey = request.result?.encryptedKey;
          if (encryptedKey && password?.length) {
            try {
              const decryptedKeyData = await decryptData(password, encryptedKey);
              resolve(JSON.parse(decryptedKeyData)); // Convert JSON back to key
            } catch (error) {
              reject(new Error('Failed to decrypt key'));
            }
          } else {
            resolve(null);
          }
        };
      })
      .catch(reject);
  });
};

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
    'deriveKey',
  ]);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_SIZE },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptData(password: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));
  const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));

  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(data));

  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode.apply(null, Array.from(result)));
}

export async function decryptData(password: string, encryptedData: string): Promise<string> {
  const dec = new TextDecoder();
  const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

  const salt = data.slice(0, SALT_SIZE);
  const iv = data.slice(SALT_SIZE, SALT_SIZE + IV_SIZE);
  const ciphertext = data.slice(SALT_SIZE + IV_SIZE);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ciphertext);

  return dec.decode(decrypted);
}
