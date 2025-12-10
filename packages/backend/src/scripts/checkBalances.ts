import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Wallet } from '../database/models';
import { getBalance, formatTokens } from '../utils/blockchain';
import logger from '../utils/logger';

async function checkBalances(): Promise<void> {
  logger.info('Checking wallet balances...\n');

  await connectDatabase();

  const wallets = await Wallet.find().sort({ index: 1 });
  logger.info(`Total wallets in DB: ${wallets.length}\n`);

  let totalBalance = 0n;
  let healthy = 0;
  let low = 0;
  let empty = 0;

  console.log('Index | Address                                    | DB Balance      | Chain Balance   | Match');
  console.log('------|--------------------------------------------|-----------------|-----------------|----- ');

  for (const wallet of wallets) {
    try {
      const chainBalance = await getBalance(wallet.address);
      const dbBalance = BigInt(wallet.balance);
      const match = chainBalance === dbBalance ? '✓' : '✗';

      const chainBalanceFormatted = formatTokens(chainBalance);
      const dbBalanceFormatted = formatTokens(dbBalance);

      console.log(
        `${String(wallet.index).padStart(5)} | ${wallet.address} | ${dbBalanceFormatted.padStart(15)} | ${chainBalanceFormatted.padStart(15)} | ${match}`
      );

      totalBalance += chainBalance;

      const bal = parseFloat(chainBalanceFormatted);
      if (bal >= 8) healthy++;
      else if (bal >= 1) low++;
      else empty++;

      // Update DB if mismatch
      if (chainBalance !== dbBalance) {
        await Wallet.updateOne(
          { address: wallet.address },
          { balance: chainBalance.toString() }
        );
      }
    } catch (error: any) {
      console.log(
        `${String(wallet.index).padStart(5)} | ${wallet.address} | ERROR: ${error.message}`
      );
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total Wallets: ${wallets.length}`);
  console.log(`Total Balance: ${formatTokens(totalBalance)} VANRY`);
  console.log(`Healthy (>=8): ${healthy}`);
  console.log(`Low (1-8):     ${low}`);
  console.log(`Empty (<1):    ${empty}`);

  await disconnectDatabase();
  process.exit(0);
}

checkBalances().catch((error) => {
  logger.error('Check failed', { error });
  process.exit(1);
});
