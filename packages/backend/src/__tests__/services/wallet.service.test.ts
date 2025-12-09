// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};
jest.mock('../../utils/logger', () => mockLogger);

// Mock blockchain utils
const mockGenerateRandomWallet = jest.fn();
const mockGetBalance = jest.fn();
const mockFormatTokens = jest.fn((amount: bigint) => {
  return (Number(amount) / 1e18).toFixed(1);
});

jest.mock('../../utils/blockchain', () => ({
  generateRandomWallet: () => mockGenerateRandomWallet(),
  getBalance: (address: string) => mockGetBalance(address),
  formatTokens: (amount: bigint) => mockFormatTokens(amount),
}));

// Mock encryption utils
const mockEncryptPrivateKey = jest.fn((key: string) => `encrypted_${key}`);
const mockDecryptPrivateKey = jest.fn((key: string) => key.replace('encrypted_', ''));

jest.mock('../../utils/encryption', () => ({
  encryptPrivateKey: (key: string) => mockEncryptPrivateKey(key),
  decryptPrivateKey: (key: string) => mockDecryptPrivateKey(key),
}));

// Mock Wallet model
const mockWalletModel = {
  countDocuments: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
};

jest.mock('../../database/models', () => ({
  Wallet: mockWalletModel,
}));

import { WalletService } from '../../services/wallet.service';

describe('WalletService', () => {
  let walletService: WalletService;

  beforeEach(() => {
    walletService = new WalletService();
    jest.clearAllMocks();
  });

  describe('generateWallets', () => {
    it('should skip generation if enough wallets exist', async () => {
      mockWalletModel.countDocuments.mockResolvedValue(100);
      mockWalletModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ address: '0x123' }]),
      });

      const result = await walletService.generateWallets(100);

      expect(mockWalletModel.countDocuments).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Already have 100 wallets'));
      expect(result).toHaveLength(1);
    });

    it('should generate new wallets when count is below target', async () => {
      mockWalletModel.countDocuments.mockResolvedValue(0);
      mockGenerateRandomWallet.mockReturnValue({
        address: '0xNewAddress',
        privateKey: '0xPrivateKey',
      });
      mockWalletModel.create.mockImplementation((data) => Promise.resolve(data));
      mockWalletModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ address: '0xNewAddress' }]),
      });

      const result = await walletService.generateWallets(2);

      expect(mockGenerateRandomWallet).toHaveBeenCalledTimes(2);
      expect(mockEncryptPrivateKey).toHaveBeenCalledTimes(2);
      expect(mockWalletModel.create).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it('should start from correct index when some wallets exist', async () => {
      mockWalletModel.countDocuments.mockResolvedValue(5);
      mockGenerateRandomWallet.mockReturnValue({
        address: '0xNewAddress',
        privateKey: '0xPrivateKey',
      });
      mockWalletModel.create.mockImplementation((data) => Promise.resolve(data));
      mockWalletModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      await walletService.generateWallets(7);

      // Should only generate 2 wallets (7 - 5 = 2)
      expect(mockGenerateRandomWallet).toHaveBeenCalledTimes(2);
      expect(mockWalletModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ index: 5 })
      );
    });
  });

  describe('getAllWallets', () => {
    it('should return all wallets sorted by index', async () => {
      const mockWallets = [
        { address: '0x1', index: 0 },
        { address: '0x2', index: 1 },
      ];
      mockWalletModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockWallets),
      });

      const result = await walletService.getAllWallets();

      expect(mockWalletModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockWallets);
    });
  });

  describe('getWalletByAddress', () => {
    it('should find wallet by address', async () => {
      const mockWallet = { address: '0x123', index: 0 };
      mockWalletModel.findOne.mockResolvedValue(mockWallet);

      const result = await walletService.getWalletByAddress('0x123');

      expect(mockWalletModel.findOne).toHaveBeenCalledWith({ address: '0x123' });
      expect(result).toEqual(mockWallet);
    });

    it('should return null when wallet not found', async () => {
      mockWalletModel.findOne.mockResolvedValue(null);

      const result = await walletService.getWalletByAddress('0xnonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getWalletByIndex', () => {
    it('should find wallet by index', async () => {
      const mockWallet = { address: '0x123', index: 5 };
      mockWalletModel.findOne.mockResolvedValue(mockWallet);

      const result = await walletService.getWalletByIndex(5);

      expect(mockWalletModel.findOne).toHaveBeenCalledWith({ index: 5 });
      expect(result).toEqual(mockWallet);
    });
  });

  describe('getEligibleWallets', () => {
    it('should return wallets with balance >= minBalance', async () => {
      const wallets = [
        { address: '0x1', balance: '10000000000000000000' }, // 10 tokens
        { address: '0x2', balance: '5000000000000000000' },  // 5 tokens
        { address: '0x3', balance: '8000000000000000000' },  // 8 tokens
      ];
      mockWalletModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(wallets),
      });

      const minBalance = BigInt('8000000000000000000'); // 8 tokens
      const result = await walletService.getEligibleWallets(minBalance);

      expect(result).toHaveLength(2);
      expect(result[0].address).toBe('0x1');
      expect(result[1].address).toBe('0x3');
    });

    it('should return empty array when no wallets meet threshold', async () => {
      const wallets = [
        { address: '0x1', balance: '1000000000000000000' }, // 1 token
      ];
      mockWalletModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(wallets),
      });

      const minBalance = BigInt('10000000000000000000'); // 10 tokens
      const result = await walletService.getEligibleWallets(minBalance);

      expect(result).toHaveLength(0);
    });
  });

  describe('updateBalance', () => {
    it('should update wallet balance from blockchain', async () => {
      const newBalance = BigInt('5000000000000000000');
      mockGetBalance.mockResolvedValue(newBalance);
      mockWalletModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await walletService.updateBalance('0x123');

      expect(mockGetBalance).toHaveBeenCalledWith('0x123');
      expect(mockWalletModel.updateOne).toHaveBeenCalledWith(
        { address: '0x123' },
        { balance: newBalance.toString(), lastActive: expect.any(Date) }
      );
      expect(result).toBe(newBalance.toString());
    });
  });

  describe('updateAllBalances', () => {
    it('should update balances for all wallets', async () => {
      const wallets = [
        { address: '0x1' },
        { address: '0x2' },
      ];
      mockWalletModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(wallets),
      });
      mockGetBalance.mockResolvedValue(BigInt('1000000000000000000'));
      mockWalletModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await walletService.updateAllBalances();

      expect(mockGetBalance).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Balance update complete');
    });

    it('should handle errors gracefully', async () => {
      const wallets = [{ address: '0x1' }];
      mockWalletModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(wallets),
      });
      mockGetBalance.mockRejectedValue(new Error('RPC error'));

      await walletService.updateAllBalances();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update balance'),
        expect.any(Object)
      );
    });
  });

  describe('incrementTxSent', () => {
    it('should increment totalTxSent counter', async () => {
      mockWalletModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await walletService.incrementTxSent('0x123');

      expect(mockWalletModel.updateOne).toHaveBeenCalledWith(
        { address: '0x123' },
        { $inc: { totalTxSent: 1 }, lastActive: expect.any(Date) }
      );
    });
  });

  describe('incrementTxReceived', () => {
    it('should increment totalTxReceived counter', async () => {
      mockWalletModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await walletService.incrementTxReceived('0x123');

      expect(mockWalletModel.updateOne).toHaveBeenCalledWith(
        { address: '0x123' },
        { $inc: { totalTxReceived: 1 }, lastActive: expect.any(Date) }
      );
    });
  });

  describe('getDecryptedPrivateKey', () => {
    it('should decrypt and return private key', () => {
      const wallet = {
        privateKey: 'encrypted_0xPrivateKey',
      } as any;

      const result = walletService.getDecryptedPrivateKey(wallet);

      expect(mockDecryptPrivateKey).toHaveBeenCalledWith('encrypted_0xPrivateKey');
      expect(result).toBe('0xPrivateKey');
    });
  });

  describe('getWalletStats', () => {
    it('should calculate wallet statistics correctly', async () => {
      const wallets = [
        { balance: '10000000000000000000' }, // 10 tokens - healthy
        { balance: '8000000000000000000' },  // 8 tokens - healthy
        { balance: '5000000000000000000' },  // 5 tokens - low
        { balance: '500000000000000000' },   // 0.5 tokens - empty
        { balance: '0' },                     // 0 tokens - empty
      ];
      mockWalletModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(wallets),
      });

      const stats = await walletService.getWalletStats();

      expect(stats.total).toBe(5);
      expect(stats.healthy).toBe(2);
      expect(stats.low).toBe(1);
      expect(stats.empty).toBe(2);
      expect(mockFormatTokens).toHaveBeenCalled();
    });

    it('should return zeros for empty wallet list', async () => {
      mockWalletModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const stats = await walletService.getWalletStats();

      expect(stats.total).toBe(0);
      expect(stats.healthy).toBe(0);
      expect(stats.low).toBe(0);
      expect(stats.empty).toBe(0);
    });
  });
});
