import { connectDatabase, disconnectDatabase } from '../database/connection';
import { walletService } from '../services/wallet.service';
import logger from '../utils/logger';

async function main(): Promise<void> {
  logger.info('Starting wallet generation...');

  await connectDatabase();

  const count = parseInt(process.argv[2]) || 100;
  logger.info(`Generating ${count} wallets...`);

  const wallets = await walletService.generateWallets(count);

  logger.info('Wallet generation complete!');
  logger.info(`Total wallets: ${wallets.length}`);

  // Display summary
  console.log('\n=== Generated Wallets ===');
  console.log(`Total: ${wallets.length}`);
  console.log('\nFirst 5 addresses:');
  wallets.slice(0, 5).forEach((w, i) => {
    console.log(`  ${i}: ${w.address}`);
  });
  console.log('\nLast 5 addresses:');
  wallets.slice(-5).forEach((w, i) => {
    console.log(`  ${wallets.length - 5 + i}: ${w.address}`);
  });

  await disconnectDatabase();
  process.exit(0);
}

main().catch((error) => {
  logger.error('Wallet generation failed', { error });
  process.exit(1);
});
