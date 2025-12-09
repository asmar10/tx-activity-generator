import { connectDatabase } from '../database/connection';
import { transactionService } from '../services/transaction.service';
import { randomDelay } from '../utils/random';
import { config } from '../config';
import logger from '../utils/logger';

const instanceId = process.argv[2] || process.env.INSTANCE_ID || 'unknown';
let isRunning = true;

async function runTransactionLoop(): Promise<void> {
  logger.info(`Transaction worker ${instanceId} starting`);

  await connectDatabase();

  while (isRunning) {
    try {
      const result = await transactionService.executeRandomTransaction(instanceId);

      if (result.success && process.send) {
        process.send({ type: 'tx_complete', data: { txHash: result.txHash } });
      } else if (!result.success && process.send) {
        process.send({ type: 'tx_error', data: { error: result.error, message: result.errorMessage } });
      }
    } catch (error: any) {
      logger.error(`Worker ${instanceId} error`, { error: error.message });
      if (process.send) {
        process.send({ type: 'tx_error', data: { error: error.message } });
      }
    }

    // Random delay between transactions
    await randomDelay(config.txDelayMin, config.txDelayMax);
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
