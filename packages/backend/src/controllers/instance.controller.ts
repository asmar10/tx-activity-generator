import { Request, Response } from 'express';
import { instanceManager } from '../services';
import logger from '../utils/logger';

export const instanceController = {
  async listInstances(req: Request, res: Response): Promise<void> {
    try {
      const stats = instanceManager.getInstanceStats();
      const running = instanceManager.getRunningCount();

      res.json({
        success: true,
        data: {
          running,
          instances: stats,
        },
      });
    } catch (error: any) {
      logger.error('Failed to list instances', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async startInstance(req: Request, res: Response): Promise<void> {
    try {
      const instanceId = await instanceManager.startInstance();

      if (!instanceId) {
        res.status(400).json({
          success: false,
          error: 'Failed to start instance (max limit reached)',
        });
        return;
      }

      res.json({
        success: true,
        data: { instanceId },
      });
    } catch (error: any) {
      logger.error('Failed to start instance', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async stopInstance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await instanceManager.stopInstance(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Instance not found',
        });
        return;
      }

      res.json({ success: true, message: 'Instance stopped' });
    } catch (error: any) {
      logger.error('Failed to stop instance', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async setInstanceCount(req: Request, res: Response): Promise<void> {
    try {
      const { count } = req.body;

      if (typeof count !== 'number' || count < 0) {
        res.status(400).json({
          success: false,
          error: 'count must be a non-negative number',
        });
        return;
      }

      await instanceManager.setInstanceCount(count);

      res.json({
        success: true,
        data: {
          targetCount: count,
          currentCount: instanceManager.getRunningCount(),
        },
      });
    } catch (error: any) {
      logger.error('Failed to set instance count', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async stopAllInstances(req: Request, res: Response): Promise<void> {
    try {
      await instanceManager.stopAllInstances();
      res.json({ success: true, message: 'All instances stopped' });
    } catch (error: any) {
      logger.error('Failed to stop all instances', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
