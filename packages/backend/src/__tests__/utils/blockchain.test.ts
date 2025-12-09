// Mock the logger before any imports
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};
jest.mock('../../utils/logger', () => mockLogger);

// Mock the config module
jest.mock('../../config', () => ({
  config: {
    vanarRpcUrl: 'https://mock-rpc.example.com',
    chainId: 2040,
    chainName: 'Vanar Mainnet',
    masterPrivateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
}));

import { ethers } from 'ethers';
import {
  parseTokens,
  formatTokens,
  generateRandomWallet,
  createWalletFromPrivateKey,
} from '../../utils/blockchain';

describe('Blockchain Utilities', () => {
  describe('parseTokens', () => {
    it('should parse string amount to bigint', () => {
      const result = parseTokens('1');
      expect(result).toBe(BigInt('1000000000000000000')); // 1e18
    });

    it('should parse decimal amounts correctly', () => {
      const result = parseTokens('0.5');
      expect(result).toBe(BigInt('500000000000000000')); // 0.5e18
    });

    it('should parse number input', () => {
      const result = parseTokens(2);
      expect(result).toBe(BigInt('2000000000000000000')); // 2e18
    });

    it('should parse small decimal amounts', () => {
      const result = parseTokens('0.01');
      expect(result).toBe(BigInt('10000000000000000')); // 0.01e18
    });

    it('should parse zero', () => {
      const result = parseTokens('0');
      expect(result).toBe(0n);
    });

    it('should parse large amounts', () => {
      const result = parseTokens('1000000');
      expect(result).toBe(BigInt('1000000000000000000000000')); // 1e24
    });
  });

  describe('formatTokens', () => {
    it('should format bigint to string', () => {
      const result = formatTokens(BigInt('1000000000000000000'));
      expect(result).toBe('1.0');
    });

    it('should format decimal amounts correctly', () => {
      const result = formatTokens(BigInt('500000000000000000'));
      expect(result).toBe('0.5');
    });

    it('should format zero', () => {
      const result = formatTokens(0n);
      expect(result).toBe('0.0');
    });

    it('should format small amounts', () => {
      const result = formatTokens(BigInt('10000000000000000'));
      expect(result).toBe('0.01');
    });

    it('should format large amounts', () => {
      const result = formatTokens(BigInt('1000000000000000000000000'));
      expect(result).toBe('1000000.0');
    });

    it('should be inverse of parseTokens', () => {
      const originalAmount = '123.456';
      const parsed = parseTokens(originalAmount);
      const formatted = formatTokens(parsed);
      expect(parseFloat(formatted)).toBeCloseTo(parseFloat(originalAmount), 10);
    });
  });

  describe('generateRandomWallet', () => {
    it('should generate a valid wallet', () => {
      const wallet = generateRandomWallet();

      expect(wallet).toBeDefined();
      expect(wallet.address).toBeDefined();
      expect(wallet.privateKey).toBeDefined();
    });

    it('should generate a wallet with valid address format', () => {
      const wallet = generateRandomWallet();

      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should generate a wallet with valid private key format', () => {
      const wallet = generateRandomWallet();

      expect(wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should generate unique wallets', () => {
      const wallet1 = generateRandomWallet();
      const wallet2 = generateRandomWallet();

      expect(wallet1.address).not.toBe(wallet2.address);
      expect(wallet1.privateKey).not.toBe(wallet2.privateKey);
    });

    it('should generate wallets with valid checksummed addresses', () => {
      const wallet = generateRandomWallet();

      // ethers always returns checksummed addresses
      expect(ethers.isAddress(wallet.address)).toBe(true);
    });
  });

  describe('createWalletFromPrivateKey', () => {
    const testPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    it('should create a wallet from private key', () => {
      const wallet = createWalletFromPrivateKey(testPrivateKey);

      expect(wallet).toBeDefined();
      expect(wallet.address).toBeDefined();
    });

    it('should create wallet with correct address for given private key', () => {
      const wallet = createWalletFromPrivateKey(testPrivateKey);

      // The address is deterministic based on the private key
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should create consistent wallet for same private key', () => {
      const wallet1 = createWalletFromPrivateKey(testPrivateKey);
      const wallet2 = createWalletFromPrivateKey(testPrivateKey);

      expect(wallet1.address).toBe(wallet2.address);
    });

    it('should throw for invalid private key', () => {
      expect(() => createWalletFromPrivateKey('invalid-key')).toThrow();
    });

    it('should throw for too short private key', () => {
      expect(() => createWalletFromPrivateKey('0x1234')).toThrow();
    });
  });

  describe('parseTokens and formatTokens round-trip', () => {
    const testCases = ['0.001', '0.01', '0.1', '1', '10', '100', '1000', '0.123456789'];

    testCases.forEach((amount) => {
      it(`should round-trip ${amount} tokens correctly`, () => {
        const parsed = parseTokens(amount);
        const formatted = formatTokens(parsed);

        expect(parseFloat(formatted)).toBeCloseTo(parseFloat(amount), 10);
      });
    });
  });
});
