import { Request, Response } from 'express';
import { walletService } from '../services';
import { formatTokens } from '../utils/blockchain';
import logger from '../utils/logger';

export const walletController = {
  async getAllWallets(req: Request, res: Response): Promise<void> {
    try {
      const wallets = await walletService.getAllWallets();
      const sanitizedWallets = wallets.map((w) => ({
        address: w.address,
        index: w.index,
        balance: formatTokens(BigInt(w.balance)),
        balanceWei: w.balance,
        lastActive: w.lastActive,
        totalTxSent: w.totalTxSent,
        totalTxReceived: w.totalTxReceived,
      }));

      res.json({ success: true, data: sanitizedWallets });
    } catch (error: any) {
      logger.error('Failed to get wallets', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async generateWallets(req: Request, res: Response): Promise<void> {
    try {
      const count = parseInt(req.body.count) || 100;
      const wallets = await walletService.generateWallets(count);

      res.json({
        success: true,
        message: `Generated ${wallets.length} wallets`,
        count: wallets.length,
      });
    } catch (error: any) {
      logger.error('Failed to generate wallets', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getWalletStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await walletService.getWalletStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      logger.error('Failed to get wallet stats', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async refreshBalances(req: Request, res: Response): Promise<void> {
    try {
      await walletService.updateAllBalances();
      res.json({ success: true, message: 'Balances updated' });
    } catch (error: any) {
      logger.error('Failed to refresh balances', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
