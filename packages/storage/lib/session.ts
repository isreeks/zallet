import { encryptData, decryptData, retrieveKey } from './keyStore'; // Your existing encryption functions

interface EncryptedSession {
  encryptedPrivateKey: string;
  expiresAt: number;
  sessionKey: number[];
}

const SESSION_KEY_LENGTH = 32; // 256 bits
const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes

// Generate a random session key
function generateSessionKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SESSION_KEY_LENGTH));
}

// Encrypt and store session
async function createSession(walletId: string, privateKey: string): Promise<void> {
  const sessionKey = generateSessionKey();
  const expiresAt = Date.now() + SESSION_DURATION;

  const encryptedPrivateKey = await encryptData(Array.from(sessionKey).toString(), privateKey);
  const encryptedSession: EncryptedSession = {
    encryptedPrivateKey,
    expiresAt,
    sessionKey: Array.from(sessionKey), // Store the session key with the encrypted data
  };

  // Store everything in chrome.storage.local
  await chrome.storage.local.set({ [walletId]: JSON.stringify(encryptedSession) });
  chrome.alarms.create('sessionTimeout', { delayInMinutes: 15 });
}

export async function getSession(walletId: string): Promise<string | null> {
  const result = await chrome.storage.local.get(walletId);

  if (!result[walletId]) return null;

  const encryptedSession: EncryptedSession = JSON.parse(result[walletId]);

  if (encryptedSession.expiresAt < Date.now()) {
    await clearSession(walletId);
    return null;
  }

  const sessionKey = new Uint8Array(encryptedSession.sessionKey);
  return await decryptData(sessionKey.toString(), encryptedSession.encryptedPrivateKey);
}

// Clear session data
export async function clearSession(walletId: string): Promise<void> {
  await chrome.storage.local.remove(walletId);
}

// Unlock wallet function
export async function unlockWallet(walletId: string, password: string): Promise<boolean> {
  try {
    const keyData = await retrieveKey('myKeyId', password);
    if (!keyData.keyData.length) {
      throw new Error('Private key not found');
    }

    await createSession(walletId, keyData.keyData);
    return true;
  } catch (error) {
    console.error('Error unlocking wallet:', error);
    return false;
  }
}

// Get private key function
async function getPrivateKey(walletId: string): Promise<string> {
  const privateKey = await getSession(walletId);
  if (privateKey) {
    return privateKey;
  }
  throw new Error('Wallet is locked. Please unlock first.');
}

// Extend session
async function extendSession(walletId: string): Promise<void> {
  const privateKey = await getSession(walletId);
  if (privateKey) {
    await createSession(walletId, privateKey);
  }
}

// Use this function after each wallet operation to extend the session
function onWalletActivity(walletId: string) {
  extendSession(walletId).catch(console.error);
}

// // Modified wallet operations
// async function getBalance(walletId: string): Promise<string> {
//   const privateKey = await getPrivateKey(walletId);
//   // ... existing balance fetching code ...
//   onWalletActivity(walletId);
//   return balance;
// }

// async function signTransaction(walletId: string, toAddress: string, amount: string): Promise<string> {
//   const privateKey = await getPrivateKey(walletId);
//   // ... existing transaction signing code ...
//   onWalletActivity(walletId);
//   return signedTx.rawTransaction;
// }
