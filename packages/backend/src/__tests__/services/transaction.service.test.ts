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
    minWalletBalance: 8,
  },
}));

// Mock blockchain utils
const mockCreateWalletFromPrivateKey = jest.fn();
const mockSendTransaction = jest.fn();
const mockParseTokens = jest.fn((amount: number) => BigInt(Math.floor(amount * 1e18)));
const mockFormatTokens = jest.fn((amount: bigint) => (Number(amount) / 1e18).toFixed(2));

jest.mock('../../utils/blockchain', () => ({
  createWalletFromPrivateKey: (key: string) => mockCreateWalletFromPrivateKey(key),
  sendTransaction: (wallet: any, to: string, amount: bigint) => mockSendTransaction(wallet, to, amount),
  parseTokens: (amount: number) => mockParseTokens(amount),
  formatTokens: (amount: bigint) => mockFormatTokens(amount),
}));

// Mock random utils
const mockPickRandom = jest.fn();
const mockPickRandomExcluding = jest.fn();
const mockCalculateTransferAmount = jest.fn();

jest.mock('../../utils/random', () => ({
  pickRandom: (arr: any[]) => mockPickRandom(arr),
  pickRandomExcluding: (arr: any[], exclude: any) => mockPickRandomExcluding(arr, exclude),
  calculateTransferAmount: (balance: bigint, minBalance: bigint) => mockCalculateTransferAmount(balance, minBalance),
}));

// Mock wallet service
const mockWalletService = {
  getEligibleWallets: jest.fn(),
  getDecryptedPrivateKey: jest.fn(),
  incrementTxSent: jest.fn(),
  incrementTxReceived: jest.fn(),
  updateBalance: jest.fn(),
};

jest.mock('../../services/wallet.service', () => ({
  walletService: mockWalletService,
}));

// Mock Transaction model
const mockTransactionModel = {
  create: jest.fn(),
  updateOne: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
};

jest.mock('../../database/models', () => ({
  Transaction: mockTransactionModel,
}));

import { TransactionService, TxError } from '../../services/transaction.service';

describe('TransactionService', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = new TransactionService();
    jest.clearAllMocks();
  });

  describe('executeRandomTransaction', () => {
    const senderWallet = {
      address: '0xSender',
      balance: '20000000000000000000', // 20 tokens
      privateKey: 'encrypted_key',
    };
    const receiverWallet = {
      address: '0xReceiver',
      balance: '10000000000000000000', // 10 tokens
    };

    it('should return error when less than 2 eligible wallets', async () => {
      mockWalletService.getEligibleWallets.mockResolvedValue([senderWallet]);

      const result = await transactionService.executeRandomTransaction('instance-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe(TxError.INSUFFICIENT_BALANCE);
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Not enough eligible wallets'));
    });

    it('should return error when transfer amount is 0', async () => {
      mockWalletService.getEligibleWallets.mockResolvedValue([senderWallet, receiverWallet]);
      mockPickRandom.mockReturnValue(senderWallet);
      mockPickRandomExcluding.mockReturnValue(receiverWallet);
      mockCalculateTransferAmount.mockReturnValue(0n);

      const result = await transactionService.executeRandomTransaction('instance-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe(TxError.INSUFFICIENT_BALANCE);
    });

    it('should execute transaction successfully', async () => {
      mockWalletService.getEligibleWallets.mockResolvedValue([senderWallet, receiverWallet]);
      mockPickRandom.mockReturnValue(senderWallet);
      mockPickRandomExcluding.mockReturnValue(receiverWallet);
      mockCalculateTransferAmount.mockReturnValue(BigInt('1000000000000000000')); // 1 token
      mockWalletService.getDecryptedPrivateKey.mockReturnValue('0xPrivateKey');
      mockCreateWalletFromPrivateKey.mockReturnValue({ address: '0xSender' });

      const mockTx = {
        hash: '0xTxHash123',
        wait: jest.fn().mockResolvedValue({ status: 1, gasUsed: BigInt(21000) }),
      };
      mockSendTransaction.mockResolvedValue(mockTx);
      mockTransactionModel.create.mockResolvedValue({});
      mockTransactionModel.updateOne.mockResolvedValue({});
      mockWalletService.incrementTxSent.mockResolvedValue(undefined);
      mockWalletService.incrementTxReceived.mockResolvedValue(undefined);
      mockWalletService.updateBalance.mockResolvedValue(undefined);

      const result = await transactionService.executeRandomTransaction('instance-1');

      expect(result.success).toBe(true);
      expect(result.txHash).toBe('0xTxHash123');
      expect(mockTransactionModel.create).toHaveBeenCalledWith(expect.objectContaining({
        txHash: '0xTxHash123',
        from: '0xSender',
        to: '0xReceiver',
        status: 'pending',
        instanceId: 'instance-1',
      }));
      expect(mockWalletService.incrementTxSent).toHaveBeenCalledWith('0xSender');
      expect(mockWalletService.incrementTxReceived).toHaveBeenCalledWith('0xReceiver');
    });

    it('should handle transaction failure', async () => {
      mockWalletService.getEligibleWallets.mockResolvedValue([senderWallet, receiverWallet]);
      mockPickRandom.mockReturnValue(senderWallet);
      mockPickRandomExcluding.mockReturnValue(receiverWallet);
      mockCalculateTransferAmount.mockReturnValue(BigInt('1000000000000000000'));
      mockWalletService.getDecryptedPrivateKey.mockReturnValue('0xPrivateKey');
      mockCreateWalletFromPrivateKey.mockReturnValue({ address: '0xSender' });
      mockSendTransaction.mockRejectedValue(new Error('insufficient funds for gas'));

      const result = await transactionService.executeRandomTransaction('instance-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe(TxError.INSUFFICIENT_BALANCE);
      expect(result.errorMessage).toContain('insufficient funds');
    });
  });

  describe('classifyError', () => {
    const testCases = [
      { message: 'insufficient funds for gas', expected: TxError.INSUFFICIENT_BALANCE },
      { message: 'insufficient balance', expected: TxError.INSUFFICIENT_BALANCE },
      { message: 'gas estimation failed', expected: TxError.GAS_ESTIMATION_FAILED },
      { message: 'nonce too low', expected: TxError.NONCE_TOO_LOW },
      { message: 'transaction underpriced', expected: TxError.TX_UNDERPRICED },
      { message: 'network error', expected: TxError.NETWORK_ERROR },
      { message: 'connection refused', expected: TxError.NETWORK_ERROR },
      { message: 'timeout exceeded', expected: TxError.TIMEOUT },
      { message: 'some unknown error', expected: TxError.UNKNOWN },
    ];

    testCases.forEach(({ message, expected }) => {
      it(`should classify "${message}" as ${expected}`, () => {
        // Access private method using any
        const error = { message };
        const result = (transactionService as any).classifyError(error);
        expect(result).toBe(expected);
      });
    });

    it('should handle undefined error message', () => {
      const result = (transactionService as any).classifyError({});
      expect(result).toBe(TxError.UNKNOWN);
    });
  });

  describe('getRecentTransactions', () => {
    it('should return transactions sorted by createdAt', async () => {
      const mockTxs = [{ txHash: '0x1' }, { txHash: '0x2' }];
      mockTransactionModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockTxs),
        }),
      });

      const result = await transactionService.getRecentTransactions(50);

      expect(result).toEqual(mockTxs);
      expect(mockTransactionModel.find).toHaveBeenCalled();
    });

    it('should use default limit of 50', async () => {
      const limitMock = jest.fn().mockResolvedValue([]);
      mockTransactionModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: limitMock,
        }),
      });

      await transactionService.getRecentTransactions();

      expect(limitMock).toHaveBeenCalledWith(50);
    });
  });

  describe('getTransactionsByInstance', () => {
    it('should filter transactions by instanceId', async () => {
      const mockTxs = [{ txHash: '0x1', instanceId: 'inst-1' }];
      mockTransactionModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockTxs),
        }),
      });

      const result = await transactionService.getTransactionsByInstance('inst-1');

      expect(result).toEqual(mockTxs);
      expect(mockTransactionModel.find).toHaveBeenCalledWith({ instanceId: 'inst-1' });
    });
  });

  describe('getTransactionStats', () => {
    it('should calculate transaction statistics', async () => {
      mockTransactionModel.countDocuments
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(90)   // successful
        .mockResolvedValueOnce(8)    // failed
        .mockResolvedValueOnce(2);   // pending

      const stats = await transactionService.getTransactionStats();

      expect(stats.total).toBe(100);
      expect(stats.successful).toBe(90);
      expect(stats.failed).toBe(8);
      expect(stats.pending).toBe(2);
      expect(stats.successRate).toBe(90);
    });

    it('should return 0 success rate when no transactions', async () => {
      mockTransactionModel.countDocuments.mockResolvedValue(0);

      const stats = await transactionService.getTransactionStats();

      expect(stats.total).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });

  describe('getTodayStats', () => {
    it('should calculate today\'s statistics', async () => {
      const mockTxs = [
        { status: 'success', amount: '1000000000000000000' }, // 1 token
        { status: 'success', amount: '2000000000000000000' }, // 2 tokens
        { status: 'failed', amount: '500000000000000000' },
        { status: 'pending', amount: '300000000000000000' },
      ];
      mockTransactionModel.find.mockResolvedValue(mockTxs);

      const stats = await transactionService.getTodayStats();

      expect(stats.totalTx).toBe(4);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(1);
      expect(mockFormatTokens).toHaveBeenCalled();
    });

    it('should return zeros when no transactions today', async () => {
      mockTransactionModel.find.mockResolvedValue([]);

      const stats = await transactionService.getTodayStats();

      expect(stats.totalTx).toBe(0);
      expect(stats.successful).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });
});
