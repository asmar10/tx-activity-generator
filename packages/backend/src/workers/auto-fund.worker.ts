import { connectDatabase } from '../database/connection';
import { fundingService } from '../services/funding.service';
import logger from '../utils/logger';

const AUTO_FUND_INTERVAL = 60000; // 60 seconds
let isRunning = true;

async function runAutoFundLoop(): Promise<void> {
  logger.info('Auto-fund worker starting');

  await connectDatabase();

  while (isRunning) {
    try {
      const result = await fundingService.executeAutoFund();
      if (result) {
        logger.info(`Auto-fund executed: ${result.funded} wallets funded, ${result.totalDistributed} VANRY distributed`);
      }
    } catch (error: any) {
      logger.error('Auto-fund error', { error: error.message });
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, AUTO_FUND_INTERVAL));
  }

  logger.info('Auto-fund worker stopped');
  process.exit(0);
}

process.on('message', (message: any) => {
  if (message.type === 'stop') {
    logger.info('Auto-fund worker received stop signal');
    isRunning = false;
  }
});

process.on('SIGTERM', () => {
  logger.info('Auto-fund worker received SIGTERM');
  isRunning = false;
});

process.on('SIGINT', () => {
  logger.info('Auto-fund worker received SIGINT');
  isRunning = false;
});

runAutoFundLoop().catch((error) => {
  logger.error('Auto-fund worker fatal error', { error });
  process.exit(1);
});
