/**
 * Client-Side Encryption Utilities for GhostVault
 * Uses the Web Crypto API for secure AES-256-GCM encryption in the browser.
 */

// Derive an AES-256 key from a master password and salt using PBKDF2
export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext string or object using AES-GCM-256
export async function encryptPayload(data: any, key: CryptoKey): Promise<{ encryptedData: string; iv: string }> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));

  // Generate a random 12-byte initialization vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    dataBuffer
  );

  return {
    encryptedData: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

// Decrypt AES-GCM-256 ciphertext
export async function decryptPayload(encryptedDataBase64: string, ivBase64: string, key: CryptoKey): Promise<any> {
  const encryptedBuffer = base64ToArrayBuffer(encryptedDataBase64);
  const ivBuffer = base64ToArrayBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    key,
    encryptedBuffer
  );

  const decoder = new TextDecoder();
  const decryptedString = decoder.decode(decryptedBuffer);

  try {
    return JSON.parse(decryptedString);
  } catch {
    return decryptedString;
  }
}

// Base64 helper utilities
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
