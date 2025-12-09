import { Request, Response } from 'express';
import { ChildProcess, fork } from 'child_process';
import path from 'path';
import { fundingService, DistributionMode } from '../services';
import logger from '../utils/logger';

let autoFundWorker: ChildProcess | null = null;

export const fundingController = {
  async getMasterBalance(req: Request, res: Response): Promise<void> {
    try {
      const balance = await fundingService.getMasterBalance();
      const address = await fundingService.getMasterAddress();

      res.json({
        success: true,
        data: { address, balance },
      });
    } catch (error: any) {
      logger.error('Failed to get master balance', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async distribute(req: Request, res: Response): Promise<void> {
    try {
      const { totalAmount, mode } = req.body as {
        totalAmount: string;
        mode: DistributionMode;
      };

      if (!totalAmount || !mode) {
        res.status(400).json({
          success: false,
          error: 'totalAmount and mode are required',
        });
        return;
      }

      if (mode !== 'equal' && mode !== 'random') {
        res.status(400).json({
          success: false,
          error: 'mode must be "equal" or "random"',
        });
        return;
      }

      const result = await fundingService.distributeTokens(totalAmount, mode);
      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Failed to distribute tokens', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async enableAutoFund(req: Request, res: Response): Promise<void> {
    try {
      if (autoFundWorker) {
        res.json({ success: true, message: 'Auto-fund already running' });
        return;
      }

      const workerPath = path.resolve(__dirname, '../workers/auto-fund.worker.js');
      autoFundWorker = fork(workerPath);

      autoFundWorker.on('exit', () => {
        autoFundWorker = null;
        logger.info('Auto-fund worker exited');
      });

      res.json({ success: true, message: 'Auto-fund enabled' });
    } catch (error: any) {
      logger.error('Failed to enable auto-fund', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async disableAutoFund(req: Request, res: Response): Promise<void> {
    try {
      if (!autoFundWorker) {
        res.json({ success: true, message: 'Auto-fund not running' });
        return;
      }

      autoFundWorker.send({ type: 'stop' });
      setTimeout(() => {
        if (autoFundWorker) {
          autoFundWorker.kill();
          autoFundWorker = null;
        }
      }, 5000);

      res.json({ success: true, message: 'Auto-fund disabled' });
    } catch (error: any) {
      logger.error('Failed to disable auto-fund', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getAutoFundStatus(req: Request, res: Response): Promise<void> {
    try {
      const checkResult = await fundingService.checkAutoFundNeeded();

      res.json({
        success: true,
        data: {
          enabled: autoFundWorker !== null,
          ...checkResult,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get auto-fund status', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
