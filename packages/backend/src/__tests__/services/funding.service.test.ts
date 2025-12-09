// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};
jest.mock('../../utils/logger', () => mockLogger);

// Mock config
jest.mock('../../config', () => ({
  config: {
    autoFundMinBalance: 5,
    autoFundThreshold: 0.3,
    minWalletBalance: 8,
  },
}));

// Mock blockchain utils
const mockMasterWallet = {
  address: '0xMasterWallet',
};
const mockGetMasterWallet = jest.fn(() => mockMasterWallet);
const mockGetBalance = jest.fn();
const mockSendTransaction = jest.fn();
const mockParseTokens = jest.fn((amount: number | string) => {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  return BigInt(Math.floor(val * 1e18));
});
const mockFormatTokens = jest.fn((amount: bigint) => (Number(amount) / 1e18).toFixed(2));

jest.mock('../../utils/blockchain', () => ({
  getMasterWallet: () => mockGetMasterWallet(),
  getBalance: (address: string) => mockGetBalance(address),
  sendTransaction: (wallet: any, to: string, amount: bigint) => mockSendTransaction(wallet, to, amount),
  parseTokens: (amount: number | string) => mockParseTokens(amount),
  formatTokens: (amount: bigint) => mockFormatTokens(amount),
}));

// Mock wallet service
const mockWalletService = {
  getAllWallets: jest.fn(),
  updateAllBalances: jest.fn(),
  updateBalance: jest.fn(),
};

jest.mock('../../services/wallet.service', () => ({
  walletService: mockWalletService,
}));

import { FundingService } from '../../services/funding.service';

describe('FundingService', () => {
  let fundingService: FundingService;

  beforeEach(() => {
    fundingService = new FundingService();
    jest.clearAllMocks();
  });

  describe('getMasterBalance', () => {
    it('should return formatted master wallet balance', async () => {
      mockGetBalance.mockResolvedValue(BigInt('10000000000000000000')); // 10 tokens

      const balance = await fundingService.getMasterBalance();

      expect(mockGetMasterWallet).toHaveBeenCalled();
      expect(mockGetBalance).toHaveBeenCalledWith('0xMasterWallet');
      expect(mockFormatTokens).toHaveBeenCalled();
    });
  });

  describe('getMasterAddress', () => {
    it('should return master wallet address', async () => {
      const address = await fundingService.getMasterAddress();

      expect(address).toBe('0xMasterWallet');
    });
  });

  describe('distributeTokens', () => {
    it('should return error when master balance is insufficient', async () => {
      mockGetBalance.mockResolvedValue(BigInt('100000000000000000')); // 0.1 tokens
      mockWalletService.getAllWallets.mockResolvedValue([{ address: '0x1' }]);

      const result = await fundingService.distributeTokens('10', 'equal');

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Insufficient master balance');
    });

    it('should distribute tokens equally', async () => {
      const wallets = [
        { address: '0x1', index: 0 },
        { address: '0x2', index: 1 },
      ];
      mockWalletService.getAllWallets.mockResolvedValue(wallets);
      mockGetBalance.mockResolvedValue(BigInt('20000000000000000000')); // 20 tokens
      mockSendTransaction.mockResolvedValue({
        wait: jest.fn().mockResolvedValue({}),
      });
      mockWalletService.updateAllBalances.mockResolvedValue(undefined);

      const result = await fundingService.distributeTokens('10', 'equal');

      expect(result.funded).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.success).toBe(true);
      expect(mockSendTransaction).toHaveBeenCalledTimes(2);
    });

    it('should handle transaction failures gracefully', async () => {
      const wallets = [
        { address: '0x1', index: 0 },
        { address: '0x2', index: 1 },
      ];
      mockWalletService.getAllWallets.mockResolvedValue(wallets);
      mockGetBalance.mockResolvedValue(BigInt('20000000000000000000'));
      mockSendTransaction
        .mockResolvedValueOnce({ wait: jest.fn().mockResolvedValue({}) })
        .mockRejectedValueOnce(new Error('Transaction failed'));
      mockWalletService.updateAllBalances.mockResolvedValue(undefined);

      const result = await fundingService.distributeTokens('10', 'equal');

      expect(result.funded).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('calculateDistribution', () => {
    it('should distribute equally in equal mode', () => {
      // Access private method
      const amounts = (fundingService as any).calculateDistribution(
        BigInt('10000000000000000000'), // 10 tokens
        2,
        'equal'
      );

      expect(amounts).toHaveLength(2);
      expect(amounts[0]).toBe(BigInt('5000000000000000000'));
      expect(amounts[1]).toBe(BigInt('5000000000000000000'));
    });

    it('should distribute with minimum guarantee in random mode', () => {
      const total = BigInt('20000000000000000000'); // 20 tokens
      const amounts = (fundingService as any).calculateDistribution(total, 2, 'random');

      expect(amounts).toHaveLength(2);
      // Each should have at least 5 tokens (minPerWallet)
      expect(amounts[0]).toBeGreaterThanOrEqual(BigInt('5000000000000000000'));
      expect(amounts[1]).toBeGreaterThanOrEqual(BigInt('5000000000000000000'));
    });

    it('should fall back to equal when total is less than minimum required', () => {
      const total = BigInt('5000000000000000000'); // 5 tokens for 2 wallets
      const amounts = (fundingService as any).calculateDistribution(total, 2, 'random');

      expect(amounts).toHaveLength(2);
      expect(amounts[0]).toBe(BigInt('2500000000000000000'));
      expect(amounts[1]).toBe(BigInt('2500000000000000000'));
    });
  });

  describe('checkAutoFundNeeded', () => {
    it('should return needed=true when percentage exceeds threshold', async () => {
      // 4 out of 10 wallets have low balance (40% > 30% threshold)
      const wallets = [
        { balance: '1000000000000000000' }, // 1 token - low
        { balance: '2000000000000000000' }, // 2 tokens - low
        { balance: '3000000000000000000' }, // 3 tokens - low
        { balance: '4000000000000000000' }, // 4 tokens - low
        { balance: '10000000000000000000' }, // 10 tokens - ok
        { balance: '10000000000000000000' },
        { balance: '10000000000000000000' },
        { balance: '10000000000000000000' },
        { balance: '10000000000000000000' },
        { balance: '10000000000000000000' },
      ];
      mockWalletService.getAllWallets.mockResolvedValue(wallets);

      const result = await fundingService.checkAutoFundNeeded();

      expect(result.needed).toBe(true);
      expect(result.lowBalanceCount).toBe(4);
      expect(result.percentage).toBe(40);
    });

    it('should return needed=false when percentage is below threshold', async () => {
      const wallets = [
        { balance: '1000000000000000000' }, // 1 token - low
        { balance: '10000000000000000000' }, // 10 tokens - ok
        { balance: '10000000000000000000' },
        { balance: '10000000000000000000' },
        { balance: '10000000000000000000' },
      ];
      mockWalletService.getAllWallets.mockResolvedValue(wallets);

      const result = await fundingService.checkAutoFundNeeded();

      expect(result.needed).toBe(false);
      expect(result.lowBalanceCount).toBe(1);
      expect(result.percentage).toBe(20);
    });
  });

  describe('executeAutoFund', () => {
    it('should return null when auto-fund not needed', async () => {
      const wallets = [
        { balance: '10000000000000000000' },
        { balance: '10000000000000000000' },
      ];
      mockWalletService.getAllWallets.mockResolvedValue(wallets);

      const result = await fundingService.executeAutoFund();

      expect(result).toBeNull();
      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Auto-fund not needed'));
    });

    it('should execute funding when threshold exceeded', async () => {
      // First call for checkAutoFundNeeded
      const walletsForCheck = [
        { balance: '1000000000000000000', address: '0x1', index: 0 },
        { balance: '1000000000000000000', address: '0x2', index: 1 },
        { balance: '10000000000000000000', address: '0x3', index: 2 },
      ];
      // 2 out of 3 = 66% > 30% threshold
      mockWalletService.getAllWallets.mockResolvedValue(walletsForCheck);
      mockGetBalance.mockResolvedValue(BigInt('100000000000000000000')); // 100 tokens
      mockSendTransaction.mockResolvedValue({
        wait: jest.fn().mockResolvedValue({}),
      });
      mockWalletService.updateBalance.mockResolvedValue(undefined);

      const result = await fundingService.executeAutoFund();

      expect(result).not.toBeNull();
      expect(result?.funded).toBeGreaterThan(0);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Auto-fund triggered'));
    });
  });

  describe('fundLowBalanceWallets', () => {
    it('should fund only wallets below minimum balance', async () => {
      const wallets = [
        { balance: '1000000000000000000', address: '0x1', index: 0 },  // 1 token - needs funding
        { balance: '10000000000000000000', address: '0x2', index: 1 }, // 10 tokens - ok
        { balance: '2000000000000000000', address: '0x3', index: 2 },  // 2 tokens - needs funding
      ];
      mockWalletService.getAllWallets.mockResolvedValue(wallets);
      mockGetBalance.mockResolvedValue(BigInt('100000000000000000000')); // 100 tokens
      mockSendTransaction.mockResolvedValue({
        wait: jest.fn().mockResolvedValue({}),
      });
      mockWalletService.updateBalance.mockResolvedValue(undefined);

      const result = await fundingService.fundLowBalanceWallets();

      expect(result.funded).toBe(2); // Only 2 wallets needed funding
      expect(mockSendTransaction).toHaveBeenCalledTimes(2);
    });

    it('should warn when master balance is insufficient', async () => {
      const wallets = [
        { balance: '0', address: '0x1', index: 0 },
        { balance: '0', address: '0x2', index: 1 },
      ];
      mockWalletService.getAllWallets.mockResolvedValue(wallets);
      mockGetBalance.mockResolvedValue(BigInt('1000000000000000000')); // 1 token (not enough)
      mockSendTransaction.mockResolvedValue({
        wait: jest.fn().mockResolvedValue({}),
      });
      mockWalletService.updateBalance.mockResolvedValue(undefined);

      await fundingService.fundLowBalanceWallets();

      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('insufficient funds'));
    });

    it('should handle funding errors gracefully', async () => {
      const wallets = [
        { balance: '1000000000000000000', address: '0x1', index: 0 },
      ];
      mockWalletService.getAllWallets.mockResolvedValue(wallets);
      mockGetBalance.mockResolvedValue(BigInt('100000000000000000000'));
      mockSendTransaction.mockRejectedValue(new Error('RPC error'));

      const result = await fundingService.fundLowBalanceWallets();

      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });
});
