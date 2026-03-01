/**
 * Secure Crypto Library for Offline-First Architecture
 * Uses Web Crypto API (AES-256-GCM + PBKDF2)
 */

export class CryptoEngine {
  private static masterKey: CryptoKey | null = null;

  /**
   * Derive a session-specific key from a user secret (e.g., password or token)
   * This key remains only in memory.
   */
  static async initialize(password: string, salt: string): Promise<void> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    this.masterKey = await crypto.subtle.deriveKey(
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

  static async encrypt(data: string): Promise<string> {
    if (!this.masterKey) throw new Error('Crypto engine not initialized');

    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.masterKey,
      encoder.encode(data)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  static async decrypt(encryptedBase64: string): Promise<string> {
    if (!this.masterKey) throw new Error('Crypto engine not initialized');

    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.masterKey,
      data
    );

    return new TextDecoder().decode(decrypted);
  }

  static clear(): void {
    this.masterKey = null;
  }
}
