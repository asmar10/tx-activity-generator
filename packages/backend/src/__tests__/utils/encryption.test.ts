import CryptoJS from 'crypto-js';

// Mock the config module
jest.mock('../../config', () => ({
  config: {
    walletEncryptionKey: 'test-encryption-key-32-characters',
  },
}));

import { encryptPrivateKey, decryptPrivateKey } from '../../utils/encryption';

describe('Encryption Utilities', () => {
  const samplePrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  describe('encryptPrivateKey', () => {
    it('should encrypt a private key', () => {
      const encrypted = encryptPrivateKey(samplePrivateKey);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(samplePrivateKey);
    });

    it('should produce different ciphertext for the same input (due to random IV)', () => {
      const encrypted1 = encryptPrivateKey(samplePrivateKey);
      const encrypted2 = encryptPrivateKey(samplePrivateKey);

      // AES encryption with CryptoJS uses random IV, so outputs should differ
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty string', () => {
      const encrypted = encryptPrivateKey('');
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });
  });

  describe('decryptPrivateKey', () => {
    it('should decrypt an encrypted private key correctly', () => {
      const encrypted = encryptPrivateKey(samplePrivateKey);
      const decrypted = decryptPrivateKey(encrypted);

      expect(decrypted).toBe(samplePrivateKey);
    });

    it('should handle round-trip encryption/decryption for various keys', () => {
      const testKeys = [
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        'simple-key',
      ];

      testKeys.forEach((key) => {
        const encrypted = encryptPrivateKey(key);
        const decrypted = decryptPrivateKey(encrypted);
        expect(decrypted).toBe(key);
      });
    });

    it('should fail or return empty/malformed for incorrect decryption key', () => {
      const encrypted = encryptPrivateKey(samplePrivateKey);

      // Manually decrypt with wrong key - this may throw or return garbage
      const bytes = CryptoJS.AES.decrypt(encrypted, 'wrong-key');

      try {
        const wrongDecryption = bytes.toString(CryptoJS.enc.Utf8);
        // If it doesn't throw, it should not equal the original
        expect(wrongDecryption).not.toBe(samplePrivateKey);
      } catch (error) {
        // Expected behavior - malformed UTF-8 data with wrong key
        expect(error).toBeDefined();
      }
    });
  });

  describe('encryption consistency', () => {
    it('should handle special characters in keys', () => {
      const specialKey = '0x!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encryptPrivateKey(specialKey);
      const decrypted = decryptPrivateKey(encrypted);

      expect(decrypted).toBe(specialKey);
    });

    it('should handle long strings', () => {
      const longKey = '0x' + 'a'.repeat(1000);
      const encrypted = encryptPrivateKey(longKey);
      const decrypted = decryptPrivateKey(encrypted);

      expect(decrypted).toBe(longKey);
    });
  });
});
