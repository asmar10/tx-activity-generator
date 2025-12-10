import { mockTransactionService, MockStats, MockTransaction } from './mock-transaction.service';
import logger from '../utils/logger';

export interface SimulatorStatus {
  enabled: boolean;
  stats: MockStats | null;
}

export interface SimulatorLiveStats {
  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: number;
  };
  wallets: {
    total: number;
    healthy: number;
    low: number;
    empty: number;
  };
  instances: {
    running: number;
    maxAllowed: number;
  };
  today: {
    totalTx: number;
    successful: number;
    failed: number;
    volume: string;
  };
  isSimulator: boolean;
}

class SimulatorService {
  private enabled: boolean = false;
  private instanceCount: number = 0;
  private onModeChange?: (enabled: boolean) => void;

  setModeChangeCallback(callback: (enabled: boolean) => void): void {
    this.onModeChange = callback;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async enable(): Promise<void> {
    if (this.enabled) {
      logger.info('Simulator mode already enabled');
      return;
    }

    this.enabled = true;
    mockTransactionService.reset();
    logger.info('Simulator mode ENABLED');

    if (this.onModeChange) {
      this.onModeChange(true);
    }
  }

  async disable(): Promise<void> {
    if (!this.enabled) {
      logger.info('Simulator mode already disabled');
      return;
    }

    this.enabled = false;
    mockTransactionService.reset();
    this.instanceCount = 0;
    logger.info('Simulator mode DISABLED - cleared mock data');

    if (this.onModeChange) {
      this.onModeChange(false);
    }
  }

  setInstanceCount(count: number): void {
    this.instanceCount = count;
  }

  getInstanceCount(): number {
    return this.instanceCount;
  }

  incrementInstanceCount(): void {
    this.instanceCount++;
  }

  decrementInstanceCount(): void {
    if (this.instanceCount > 0) {
      this.instanceCount--;
    }
  }

  getStatus(): SimulatorStatus {
    return {
      enabled: this.enabled,
      stats: this.enabled ? mockTransactionService.getMockStats() : null,
    };
  }

  getMockLiveStats(maxInstances: number = 10): SimulatorLiveStats {
    const stats = mockTransactionService.getMockStats();
    const mockWallets = mockTransactionService.getMockWallets();

    return {
      transactions: {
        total: stats.total,
        successful: stats.successful,
        failed: stats.failed,
        pending: stats.pending,
        successRate: stats.successRate,
      },
      wallets: {
        total: mockWallets.length,
        healthy: mockWallets.length, // All mock wallets are "healthy"
        low: 0,
        empty: 0,
      },
      instances: {
        running: this.instanceCount,
        maxAllowed: maxInstances,
      },
      today: {
        totalTx: stats.total,
        successful: stats.successful,
        failed: stats.failed,
        volume: stats.volume,
      },
      isSimulator: true,
    };
  }

  getRecentTransactions(limit: number = 50): MockTransaction[] {
    return mockTransactionService.getRecentTransactions(limit);
  }

  reset(): void {
    mockTransactionService.reset();
    this.instanceCount = 0;
    logger.info('Simulator data reset');
  }
}

export const simulatorService = new SimulatorService();
