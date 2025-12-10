import { connectDatabase } from '../database/connection';
import { transactionService } from '../services/transaction.service';
import { mockTransactionService } from '../services/mock-transaction.service';
import { randomDelay } from '../utils/random';
import { config } from '../config';
import logger from '../utils/logger';

const instanceId = process.argv[2] || process.env.INSTANCE_ID || 'unknown';
const isSimulatorMode = process.env.SIMULATOR_MODE === 'true';
let isRunning = true;

async function runTransactionLoop(): Promise<void> {
  logger.info(`Transaction worker ${instanceId} starting in ${isSimulatorMode ? 'SIMULATOR' : 'MAINNET'} mode`);

  // Only connect to database if not in simulator mode
  if (!isSimulatorMode) {
    await connectDatabase();
  }

  while (isRunning) {
    try {
      let result;

      if (isSimulatorMode) {
        // Use mock transaction service
        result = await mockTransactionService.executeRandomTransaction(instanceId);
      } else {
        // Use real transaction service
        result = await transactionService.executeRandomTransaction(instanceId);
      }

      if (result.success && process.send) {
        process.send({
          type: 'tx_complete',
          data: {
            txHash: result.txHash,
            from: result.from,
            to: result.to,
            amount: result.amount,
            isSimulator: isSimulatorMode,
          },
        });
      } else if (!result.success && process.send) {
        process.send({
          type: 'tx_error',
          data: {
            error: result.error,
            message: result.errorMessage,
            isSimulator: isSimulatorMode,
          },
        });
      }
    } catch (error: any) {
      logger.error(`Worker ${instanceId} error`, { error: error.message });
      if (process.send) {
        process.send({ type: 'tx_error', data: { error: error.message, isSimulator: isSimulatorMode } });
      }
    }

    // Random delay between transactions (shorter in simulator mode for faster testing)
    const minDelay = isSimulatorMode ? 500 : config.txDelayMin;
    const maxDelay = isSimulatorMode ? 1500 : config.txDelayMax;
    await randomDelay(minDelay, maxDelay);
  }

  logger.info(`Transaction worker ${instanceId} stopped`);
  process.exit(0);
}

process.on('message', (message: any) => {
  if (message.type === 'stop') {
    logger.info(`Worker ${instanceId} received stop signal`);
    isRunning = false;
  }
});

process.on('SIGTERM', () => {
  logger.info(`Worker ${instanceId} received SIGTERM`);
  isRunning = false;
});

process.on('SIGINT', () => {
  logger.info(`Worker ${instanceId} received SIGINT`);
  isRunning = false;
});

runTransactionLoop().catch((error) => {
  logger.error(`Worker ${instanceId} fatal error`, { error });
  process.exit(1);
});
