import { ChildProcess, fork } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import logger from '../utils/logger';
import { simulatorService } from './simulator.service';
import { emitClearTransactions } from '../socket';

export interface InstanceStats {
  id: string;
  startedAt: Date;
  transactionsExecuted: number;
  lastTransactionAt: Date | null;
  status: 'running' | 'stopped' | 'error';
}

export interface InstanceMessage {
  type: 'tx_complete' | 'tx_error' | 'status';
  data: any;
}

class InstanceManager {
  private instances: Map<string, ChildProcess> = new Map();
  private instanceStats: Map<string, InstanceStats> = new Map();
  private onStatsUpdate?: (stats: InstanceStats[]) => void;
  private onTransactionComplete?: (tx: any) => void;

  setStatsCallback(callback: (stats: InstanceStats[]) => void): void {
    this.onStatsUpdate = callback;
  }

  setTransactionCallback(callback: (tx: any) => void): void {
    this.onTransactionComplete = callback;
  }

  async startInstance(): Promise<string | null> {
    if (this.instances.size >= config.maxInstances) {
      logger.warn(`Maximum instances (${config.maxInstances}) reached`);
      return null;
    }

    const instanceId = uuidv4();
    // Handle both development (.ts) and production (.js)
    const extension = __filename.endsWith('.ts') ? '.ts' : '.js';
    const workerPath = path.resolve(__dirname, `../workers/transaction.worker${extension}`);

    try {
      const isSimulator = simulatorService.isEnabled();
      const isTsNode = extension === '.ts';

      const child = fork(workerPath, [instanceId], {
        env: {
          ...process.env,
          INSTANCE_ID: instanceId,
          SIMULATOR_MODE: isSimulator ? 'true' : 'false',
        },
        // Pass ts-node execution args when running TypeScript files
        execArgv: isTsNode ? ['-r', 'ts-node/register'] : [],
      });

      child.on('message', (message: InstanceMessage) => {
        this.handleWorkerMessage(instanceId, message);
      });

      child.on('error', (error) => {
        logger.error(`Instance ${instanceId} error`, { error });
        this.updateInstanceStatus(instanceId, 'error');
      });

      child.on('exit', (code) => {
        logger.info(`Instance ${instanceId} exited with code ${code}`);
        this.instances.delete(instanceId);
        this.instanceStats.delete(instanceId);

        // Decrement simulator instance count if in simulator mode
        if (simulatorService.isEnabled()) {
          simulatorService.decrementInstanceCount();
        }

        this.emitStatsUpdate();
      });

      this.instances.set(instanceId, child);
      this.instanceStats.set(instanceId, {
        id: instanceId,
        startedAt: new Date(),
        transactionsExecuted: 0,
        lastTransactionAt: null,
        status: 'running',
      });

      logger.info(`Started instance ${instanceId}${isSimulator ? ' (SIMULATOR)' : ''}`);

      // Track simulator instance count
      if (isSimulator) {
        simulatorService.incrementInstanceCount();
      }

      this.emitStatsUpdate();
      return instanceId;
    } catch (error) {
      logger.error('Failed to start instance', { error });
      return null;
    }
  }

  async stopInstance(instanceId: string): Promise<boolean> {
    const child = this.instances.get(instanceId);
    if (!child) {
      logger.warn(`Instance ${instanceId} not found`);
      return false;
    }

    child.send({ type: 'stop' });

    // Force kill after 5 seconds if not stopped
    setTimeout(() => {
      if (this.instances.has(instanceId)) {
        child.kill();
        this.instances.delete(instanceId);
        this.instanceStats.delete(instanceId);
        this.emitStatsUpdate();
      }
    }, 5000);

    return true;
  }

  async stopAllInstances(): Promise<void> {
    const instanceIds = Array.from(this.instances.keys());
    logger.info(`Stopping all ${instanceIds.length} instances`);

    await Promise.all(instanceIds.map((id) => this.stopInstance(id)));
  }

  async setInstanceCount(targetCount: number): Promise<void> {
    const currentCount = this.instances.size;

    if (targetCount > config.maxInstances) {
      targetCount = config.maxInstances;
      logger.warn(`Requested count exceeds max, setting to ${config.maxInstances}`);
    }

    if (targetCount > currentCount) {
      // Start more instances
      const toStart = targetCount - currentCount;
      for (let i = 0; i < toStart; i++) {
        await this.startInstance();
      }
    } else if (targetCount < currentCount) {
      // Stop some instances
      const toStop = currentCount - targetCount;
      const instanceIds = Array.from(this.instances.keys()).slice(0, toStop);
      await Promise.all(instanceIds.map((id) => this.stopInstance(id)));
    }
  }

  getRunningCount(): number {
    return this.instances.size;
  }

  getInstanceStats(): InstanceStats[] {
    return Array.from(this.instanceStats.values());
  }

  async reset(): Promise<void> {
    logger.info('Resetting: stopping all instances and clearing transaction feed');
    await this.stopAllInstances();
    emitClearTransactions();
    logger.info('Reset complete');
  }

  private handleWorkerMessage(instanceId: string, message: InstanceMessage): void {
    const stats = this.instanceStats.get(instanceId);
    if (!stats) return;

    switch (message.type) {
      case 'tx_complete':
        stats.transactionsExecuted++;
        stats.lastTransactionAt = new Date();
        // Emit transaction for real-time updates
        if (this.onTransactionComplete && message.data) {
          this.onTransactionComplete({
            txHash: message.data.txHash,
            from: message.data.from,
            to: message.data.to,
            amount: message.data.amount,
            status: 'success',
            instanceId,
            isSimulator: message.data.isSimulator || false,
            createdAt: new Date().toISOString(),
          });
        }
        break;
      case 'tx_error':
        logger.error(`Instance ${instanceId} transaction error`, { error: message.data });
        break;
      case 'status':
        logger.debug(`Instance ${instanceId} status`, { data: message.data });
        break;
    }

    this.instanceStats.set(instanceId, stats);
    this.emitStatsUpdate();
  }

  private updateInstanceStatus(instanceId: string, status: InstanceStats['status']): void {
    const stats = this.instanceStats.get(instanceId);
    if (stats) {
      stats.status = status;
      this.instanceStats.set(instanceId, stats);
      this.emitStatsUpdate();
    }
  }

  private emitStatsUpdate(): void {
    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.getInstanceStats());
    }
  }
}

export const instanceManager = new InstanceManager();
