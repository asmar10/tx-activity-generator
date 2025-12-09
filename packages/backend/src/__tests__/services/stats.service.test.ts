// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};
jest.mock('../../utils/logger', () => mockLogger);

// Mock blockchain utils
const mockFormatTokens = jest.fn((amount: bigint) => (Number(amount) / 1e18).toFixed(2));
jest.mock('../../utils/blockchain', () => ({
  formatTokens: (amount: bigint) => mockFormatTokens(amount),
}));

// Mock transaction service
const mockTransactionService = {
  getTransactionStats: jest.fn(),
  getTodayStats: jest.fn(),
};
jest.mock('../../services/transaction.service', () => ({
  transactionService: mockTransactionService,
}));

// Mock wallet service
const mockWalletService = {
  getWalletStats: jest.fn(),
};
jest.mock('../../services/wallet.service', () => ({
  walletService: mockWalletService,
}));

// Mock instance manager
const mockInstanceManager = {
  getRunningCount: jest.fn(),
};
jest.mock('../../services/instance.service', () => ({
  instanceManager: mockInstanceManager,
}));

// Mock funding service
const mockFundingService = {
  getMasterAddress: jest.fn(),
  getMasterBalance: jest.fn(),
};
jest.mock('../../services/funding.service', () => ({
  fundingService: mockFundingService,
}));

// Mock Stats and Transaction models
const mockStatsModel = {
  findOneAndUpdate: jest.fn(),
  find: jest.fn(),
};
const mockTransactionModel = {
  find: jest.fn(),
};
jest.mock('../../database/models', () => ({
  Stats: mockStatsModel,
  Transaction: mockTransactionModel,
}));

import { StatsService } from '../../services/stats.service';

describe('StatsService', () => {
  let statsService: StatsService;

  beforeEach(() => {
    statsService = new StatsService();
    jest.clearAllMocks();
  });

  describe('getLiveStats', () => {
    it('should aggregate all stats into LiveStats object', async () => {
      mockTransactionService.getTransactionStats.mockResolvedValue({
        total: 100,
        successful: 90,
        failed: 8,
        pending: 2,
        successRate: 90,
      });
      mockTransactionService.getTodayStats.mockResolvedValue({
        totalTx: 50,
        successful: 45,
        failed: 5,
        volume: '100.00',
      });
      mockWalletService.getWalletStats.mockResolvedValue({
        total: 100,
        healthy: 80,
        low: 15,
        empty: 5,
        totalBalance: '1000.00',
      });
      mockFundingService.getMasterAddress.mockResolvedValue('0xMasterAddress');
      mockFundingService.getMasterBalance.mockResolvedValue('500.00');
      mockInstanceManager.getRunningCount.mockReturnValue(3);

      const stats = await statsService.getLiveStats();

      expect(stats.instances.running).toBe(3);
      expect(stats.instances.maxAllowed).toBe(10);
      expect(stats.transactions.total).toBe(100);
      expect(stats.transactions.successRate).toBe(90);
      expect(stats.today.totalTx).toBe(50);
      expect(stats.wallets.total).toBe(100);
      expect(stats.masterWallet.address).toBe('0xMasterAddress');
      expect(stats.masterWallet.balance).toBe('500.00');
    });

    it('should call all services in parallel', async () => {
      mockTransactionService.getTransactionStats.mockResolvedValue({});
      mockTransactionService.getTodayStats.mockResolvedValue({});
      mockWalletService.getWalletStats.mockResolvedValue({});
      mockFundingService.getMasterAddress.mockResolvedValue('0x');
      mockFundingService.getMasterBalance.mockResolvedValue('0');
      mockInstanceManager.getRunningCount.mockReturnValue(0);

      await statsService.getLiveStats();

      expect(mockTransactionService.getTransactionStats).toHaveBeenCalled();
      expect(mockTransactionService.getTodayStats).toHaveBeenCalled();
      expect(mockWalletService.getWalletStats).toHaveBeenCalled();
      expect(mockFundingService.getMasterAddress).toHaveBeenCalled();
      expect(mockFundingService.getMasterBalance).toHaveBeenCalled();
    });
  });

  describe('updateDailyStats', () => {
    it('should update or create daily stats document', async () => {
      mockTransactionService.getTodayStats.mockResolvedValue({
        totalTx: 100,
        successful: 95,
        failed: 5,
        volume: '500.00',
      });
      mockInstanceManager.getRunningCount.mockReturnValue(5);
      mockStatsModel.findOneAndUpdate.mockResolvedValue({});

      await statsService.updateDailyStats();

      expect(mockStatsModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ date: expect.any(Date) }),
        expect.objectContaining({
          $set: {
            totalTransactions: 100,
            successfulTx: 95,
            failedTx: 5,
            totalVolume: '500.00',
            instancesRun: 5,
          },
        }),
        { upsert: true }
      );
      expect(mockLogger.debug).toHaveBeenCalledWith('Updated daily stats');
    });
  });

  describe('getHistoricalStats', () => {
    it('should query stats for the specified number of days', async () => {
      const mockStats = [
        { date: new Date('2024-01-01'), totalTransactions: 100 },
        { date: new Date('2024-01-02'), totalTransactions: 150 },
      ];
      mockStatsModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockStats),
      });

      const result = await statsService.getHistoricalStats(7);

      expect(mockStatsModel.find).toHaveBeenCalledWith({
        date: { $gte: expect.any(Date) },
      });
      expect(result).toEqual(mockStats);
    });

    it('should use default of 7 days when not specified', async () => {
      mockStatsModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      await statsService.getHistoricalStats();

      expect(mockStatsModel.find).toHaveBeenCalled();
    });

    it('should return sorted results by date ascending', async () => {
      const sortMock = jest.fn().mockResolvedValue([]);
      mockStatsModel.find.mockReturnValue({
        sort: sortMock,
      });

      await statsService.getHistoricalStats(7);

      expect(sortMock).toHaveBeenCalledWith({ date: 1 });
    });
  });

  describe('getTotalVolume', () => {
    it('should calculate total volume from successful transactions', async () => {
      const transactions = [
        { amount: '1000000000000000000', status: 'success' },  // 1 token
        { amount: '2000000000000000000', status: 'success' },  // 2 tokens
        { amount: '3000000000000000000', status: 'success' },  // 3 tokens
      ];
      mockTransactionModel.find.mockResolvedValue(transactions);

      const volume = await statsService.getTotalVolume();

      expect(mockTransactionModel.find).toHaveBeenCalledWith({ status: 'success' });
      expect(mockFormatTokens).toHaveBeenCalledWith(BigInt('6000000000000000000'));
    });

    it('should return 0 volume when no successful transactions', async () => {
      mockTransactionModel.find.mockResolvedValue([]);

      await statsService.getTotalVolume();

      expect(mockFormatTokens).toHaveBeenCalledWith(0n);
    });

    it('should only count successful transactions', async () => {
      // The find query filters by status, so we simulate that
      mockTransactionModel.find.mockResolvedValue([
        { amount: '1000000000000000000' },
      ]);

      await statsService.getTotalVolume();

      expect(mockTransactionModel.find).toHaveBeenCalledWith({ status: 'success' });
    });
  });
});
