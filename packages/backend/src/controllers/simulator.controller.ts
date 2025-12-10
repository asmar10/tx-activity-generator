import { Request, Response } from 'express';
import { simulatorService } from '../services/simulator.service';
import { instanceManager } from '../services/instance.service';
import logger from '../utils/logger';

export const simulatorController = {
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = simulatorService.getStatus();
      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      logger.error('Failed to get simulator status', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async enable(req: Request, res: Response): Promise<void> {
    try {
      // Stop all running instances before enabling simulator
      const runningCount = instanceManager.getRunningCount();
      if (runningCount > 0) {
        logger.info(`Stopping ${runningCount} instances before enabling simulator`);
        await instanceManager.stopAllInstances();
      }

      await simulatorService.enable();

      res.json({
        success: true,
        data: { enabled: true, message: 'Simulator mode enabled' },
      });
    } catch (error: any) {
      logger.error('Failed to enable simulator', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async disable(req: Request, res: Response): Promise<void> {
    try {
      // Stop all running instances before disabling simulator
      const runningCount = instanceManager.getRunningCount();
      if (runningCount > 0) {
        logger.info(`Stopping ${runningCount} instances before disabling simulator`);
        await instanceManager.stopAllInstances();
      }

      await simulatorService.disable();

      res.json({
        success: true,
        data: { enabled: false, message: 'Simulator mode disabled, mock data cleared' },
      });
    } catch (error: any) {
      logger.error('Failed to disable simulator', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = simulatorService.getRecentTransactions(limit);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error: any) {
      logger.error('Failed to get simulator transactions', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async reset(req: Request, res: Response): Promise<void> {
    try {
      simulatorService.reset();

      res.json({
        success: true,
        data: { message: 'Simulator data reset' },
      });
    } catch (error: any) {
      logger.error('Failed to reset simulator', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
