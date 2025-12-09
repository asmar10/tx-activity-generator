import { Request, Response } from 'express';
import { statsService, transactionService } from '../services';
import { formatTokens } from '../utils/blockchain';
import logger from '../utils/logger';

export const statsController = {
  async getLiveStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await statsService.getLiveStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      logger.error('Failed to get live stats', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getHistoricalStats(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const stats = await statsService.getHistoricalStats(days);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      logger.error('Failed to get historical stats', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getRecentTransactions(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await transactionService.getRecentTransactions(limit);

      const sanitized = transactions.map((tx) => ({
        txHash: tx.txHash,
        from: tx.from,
        to: tx.to,
        amount: formatTokens(BigInt(tx.amount)),
        status: tx.status,
        gasUsed: tx.gasUsed,
        createdAt: tx.createdAt,
      }));

      res.json({ success: true, data: sanitized });
    } catch (error: any) {
      logger.error('Failed to get recent transactions', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
