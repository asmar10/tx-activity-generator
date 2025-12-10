import { randomBytes } from 'crypto';
import { ethers } from 'ethers';
import logger from '../utils/logger';
import { randomInt } from '../utils/random';

export interface MockTransactionResult {
  success: boolean;
  txHash?: string;
  from?: string;
  to?: string;
  amount?: string;
  error?: string;
  errorMessage?: string;
}

export interface MockTransaction {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  status: 'success' | 'failed';
  instanceId: string;
  createdAt: Date;
}

export interface MockStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
  volume: string;
}

interface MockWallet {
  address: string;
  balance: bigint;
}

class MockTransactionService {
  private mockWallets: MockWallet[] = [];
  private transactions: MockTransaction[] = [];
  private stats = {
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    volume: 0n,
  };
  private failureRate: number = 0.05; // 5% failure rate
  private minDelay: number = 100;
  private maxDelay: number = 500;
  private initialBalance: bigint = ethers.parseEther('100'); // 100 VANRY per wallet

  constructor() {
    this.initializeMockWallets(100);
  }

  initializeMockWallets(count: number = 100): void {
    this.mockWallets = [];
    for (let i = 0; i < count; i++) {
      const wallet = ethers.Wallet.createRandom();
      this.mockWallets.push({
        address: wallet.address,
        balance: this.initialBalance,
      });
    }
    logger.info(`Initialized ${count} mock wallets with ${ethers.formatEther(this.initialBalance)} VANRY each`);
  }

  async executeRandomTransaction(instanceId: string): Promise<MockTransactionResult> {
    // Simulate network delay
    const delay = Math.floor(Math.random() * (this.maxDelay - this.minDelay) + this.minDelay);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Generate fake transaction data
    const txHash = `0x${randomBytes(32).toString('hex')}`;

    // Find wallets with sufficient balance
    const eligibleWallets = this.mockWallets.filter(w => w.balance > ethers.parseEther('1'));
    if (eligibleWallets.length < 2) {
      // Reset balances if too many wallets are depleted
      this.resetBalances();
      return {
        success: false,
        error: 'INSUFFICIENT_WALLETS',
        errorMessage: 'Not enough wallets with balance, resetting...',
      };
    }

    // Pick random sender from eligible wallets
    const senderIndex = randomInt(0, eligibleWallets.length - 1);
    const sender = eligibleWallets[senderIndex];

    // Pick random receiver (different from sender)
    let receiver: MockWallet;
    do {
      const receiverIndex = randomInt(0, this.mockWallets.length - 1);
      receiver = this.mockWallets[receiverIndex];
    } while (receiver.address === sender.address);

    // Calculate amount as random percentage (1-30%) of sender's balance
    const percentage = randomInt(1, 30);
    const amount = (sender.balance * BigInt(percentage)) / 100n;

    // Minimum amount check
    if (amount < ethers.parseEther('0.01')) {
      return {
        success: false,
        error: 'AMOUNT_TOO_SMALL',
        errorMessage: 'Calculated amount too small',
      };
    }

    // Determine if transaction succeeds (95% success rate)
    const success = Math.random() > this.failureRate;

    if (success) {
      // Update balances
      sender.balance -= amount;
      receiver.balance += amount;
    }

    const transaction: MockTransaction = {
      txHash,
      from: sender.address,
      to: receiver.address,
      amount: amount.toString(),
      status: success ? 'success' : 'failed',
      instanceId,
      createdAt: new Date(),
    };

    // Update stats
    this.stats.total++;
    if (success) {
      this.stats.successful++;
      this.stats.volume += amount;
    } else {
      this.stats.failed++;
    }

    // Keep only last 100 transactions in memory
    this.transactions.push(transaction);
    if (this.transactions.length > 100) {
      this.transactions.shift();
    }

    const amountFormatted = ethers.formatEther(amount);
    logger.debug(`Mock TX: ${sender.address.slice(0, 10)}... -> ${receiver.address.slice(0, 10)}... (${amountFormatted} VANRY, ${percentage}%) - ${success ? 'SUCCESS' : 'FAILED'}`);

    if (success) {
      return {
        success: true,
        txHash,
        from: sender.address,
        to: receiver.address,
        amount: amount.toString(),
      };
    } else {
      return {
        success: false,
        error: 'SIMULATED_FAILURE',
        errorMessage: 'Simulated random transaction failure',
      };
    }
  }

  private resetBalances(): void {
    for (const wallet of this.mockWallets) {
      wallet.balance = this.initialBalance;
    }
    logger.info('Reset all mock wallet balances');
  }

  getMockStats(): MockStats {
    return {
      total: this.stats.total,
      successful: this.stats.successful,
      failed: this.stats.failed,
      pending: this.stats.pending,
      successRate: this.stats.total > 0 ? (this.stats.successful / this.stats.total) * 100 : 0,
      volume: ethers.formatEther(this.stats.volume),
    };
  }

  getRecentTransactions(limit: number = 50): MockTransaction[] {
    return this.transactions.slice(-limit).reverse();
  }

  getMockWallets(): string[] {
    return this.mockWallets.map(w => w.address);
  }

  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  setDelay(min: number, max: number): void {
    this.minDelay = min;
    this.maxDelay = max;
  }

  reset(): void {
    this.transactions = [];
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0,
      volume: 0n,
    };
    // Reset wallet balances
    this.resetBalances();
    logger.info('Mock transaction service reset');
  }
}

export const mockTransactionService = new MockTransactionService();
