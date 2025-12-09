import CryptoJS from 'crypto-js';
import { config } from '../config';

export function encryptPrivateKey(privateKey: string): string {
  return CryptoJS.AES.encrypt(privateKey, config.walletEncryptionKey).toString();
}

export function decryptPrivateKey(encryptedKey: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedKey, config.walletEncryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
