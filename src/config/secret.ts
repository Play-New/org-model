/**
 * Secrets encrypted at rest on the device — never shown, never in the org. A
 * non-extractable AES-GCM key lives in IndexedDB (usable to decrypt in-page, but
 * never readable as bytes); only ciphertext is stored. Two secrets share the key:
 * the Anthropic API key and (when the org lives on GitHub) the access token.
 * Browser-only (Web Crypto + IndexedDB); not unit-tested.
 */

import { del, get, set } from 'idb-keyval';

const CRYPTO_KEY = 'org-model:crypto-key';
const SLOT_API = 'org-model:api-key';
const SLOT_GH = 'org-model:github-token';

interface Cipher {
  iv: number[];
  ct: number[];
}

async function cryptoKey(): Promise<CryptoKey> {
  const existing = await get<CryptoKey>(CRYPTO_KEY);
  if (existing) return existing;
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await set(CRYPTO_KEY, key); // CryptoKey is structured-cloneable; stored non-extractable
  return key;
}

async function setSecret(slot: string, plain: string): Promise<void> {
  const key = await cryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));
  const blob: Cipher = { iv: Array.from(iv), ct: Array.from(new Uint8Array(ct)) };
  await set(slot, blob);
}

async function getSecret(slot: string): Promise<string | null> {
  const blob = await get<Cipher>(slot);
  if (!blob) return null;
  try {
    const key = await cryptoKey();
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(blob.iv) }, key, new Uint8Array(blob.ct));
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}

async function hasSecret(slot: string): Promise<boolean> {
  return (await get<Cipher>(slot)) != null;
}

// Anthropic API key.
export const setApiKey = (plain: string) => setSecret(SLOT_API, plain);
export const getApiKey = () => getSecret(SLOT_API);
export const hasApiKey = () => hasSecret(SLOT_API);
export const clearApiKey = () => del(SLOT_API);

// GitHub access token (only when the org lives on GitHub).
export const setGithubToken = (plain: string) => setSecret(SLOT_GH, plain);
export const getGithubToken = () => getSecret(SLOT_GH);
export const hasGithubToken = () => hasSecret(SLOT_GH);
export const clearGithubToken = () => del(SLOT_GH);
