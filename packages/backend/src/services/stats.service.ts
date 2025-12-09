import { Stats, Transaction } from '../database/models';
import { transactionService } from './transaction.service';
import { walletService } from './wallet.service';
import { instanceManager } from './instance.service';
import { fundingService } from './funding.service';
import { formatTokens } from '../utils/blockchain';
import logger from '../utils/logger';

export interface LiveStats {
  instances: {
    running: number;
    maxAllowed: number;
  };
  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: number;
  };
  today: {
    totalTx: number;
    successful: number;
    failed: number;
    volume: string;
  };
  wallets: {
    total: number;
    healthy: number;
    low: number;
    empty: number;
    totalBalance: string;
  };
  masterWallet: {
    address: string;
    balance: string;
  };
}

export class StatsService {
  async getLiveStats(): Promise<LiveStats> {
    const [txStats, todayStats, walletStats, masterAddress, masterBalance] = await Promise.all([
      transactionService.getTransactionStats(),
      transactionService.getTodayStats(),
      walletService.getWalletStats(),
      fundingService.getMasterAddress(),
      fundingService.getMasterBalance(),
    ]);

    return {
      instances: {
        running: instanceManager.getRunningCount(),
        maxAllowed: 10,
      },
      transactions: txStats,
      today: todayStats,
      wallets: walletStats,
      masterWallet: {
        address: masterAddress,
        balance: masterBalance,
      },
    };
  }

  async updateDailyStats(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await transactionService.getTodayStats();

    await Stats.findOneAndUpdate(
      { date: today },
      {
        $set: {
          totalTransactions: todayStats.totalTx,
          successfulTx: todayStats.successful,
          failedTx: todayStats.failed,
          totalVolume: todayStats.volume,
          instancesRun: instanceManager.getRunningCount(),
        },
      },
      { upsert: true }
    );

    logger.debug('Updated daily stats');
  }

  async getHistoricalStats(days: number = 7): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return Stats.find({
      date: { $gte: startDate },
    }).sort({ date: 1 });
  }

  async getTotalVolume(): Promise<string> {
    const transactions = await Transaction.find({ status: 'success' });
    let total = 0n;

    for (const tx of transactions) {
      total += BigInt(tx.amount);
    }

    return formatTokens(total);
  }
}

export const statsService = new StatsService();
