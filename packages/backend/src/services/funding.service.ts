import { walletService } from './wallet.service';
import { getMasterWallet, getBalance, sendTransaction, parseTokens, formatTokens, createWalletFromPrivateKey } from '../utils/blockchain';
import { pickRandom } from '../utils/random';
import { config } from '../config';
import logger from '../utils/logger';
import { emitFundingProgress } from '../socket';

export type DistributionMode = 'equal' | 'random';

export interface FundingResult {
  success: boolean;
  funded: number;
  failed: number;
  totalDistributed: string;
  errors: string[];
}

export class FundingService {
  async getMasterBalance(): Promise<string> {
    const masterWallet = getMasterWallet();
    const balance = await getBalance(masterWallet.address);
    return formatTokens(balance);
  }

  async getMasterAddress(): Promise<string> {
    const masterWallet = getMasterWallet();
    return masterWallet.address;
  }

  async distributeTokens(totalAmount: string, mode: DistributionMode): Promise<FundingResult> {
    const masterWallet = getMasterWallet();
    const wallets = await walletService.getAllWallets();
    const totalWei = parseTokens(totalAmount);
    const masterBalance = await getBalance(masterWallet.address);

    if (masterBalance < totalWei) {
      return {
        success: false,
        funded: 0,
        failed: 0,
        totalDistributed: '0',
        errors: [`Insufficient master balance. Have: ${formatTokens(masterBalance)}, Need: ${totalAmount}`],
      };
    }

    const amounts = this.calculateDistribution(totalWei, wallets.length, mode);
    const errors: string[] = [];
    let funded = 0;
    let failed = 0;
    let totalDistributed = 0n;

    logger.info(`Starting ${mode} distribution of ${totalAmount} VANRY to ${wallets.length} wallets`);

    // Emit initial progress
    emitFundingProgress({ funded: 0, total: wallets.length });

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const amount = amounts[i];

      if (amount === 0n) continue;

      try {
        const tx = await sendTransaction(masterWallet, wallet.address, amount);
        await tx.wait();

        funded++;
        totalDistributed += amount;
        logger.debug(`Funded wallet ${wallet.index}: ${formatTokens(amount)} VANRY`);

        // Emit progress update
        emitFundingProgress({ funded, total: wallets.length, current: wallet.address });
      } catch (error: any) {
        failed++;
        errors.push(`Failed to fund ${wallet.address}: ${error.message}`);
        logger.error(`Failed to fund wallet ${wallet.index}`, { error: error.message });

        // Emit progress even on failure
        emitFundingProgress({ funded, total: wallets.length, current: wallet.address });
      }
    }

    // Emit completion (funded = -1 signals completion)
    emitFundingProgress({ funded: -1, total: wallets.length });

    // Update all balances after funding
    await walletService.updateAllBalances();

    logger.info(`Distribution complete. Funded: ${funded}, Failed: ${failed}`);

    return {
      success: failed === 0,
      funded,
      failed,
      totalDistributed: formatTokens(totalDistributed),
      errors,
    };
  }

  /**
   * Two-hop distribution: Master -> Random Wallet -> All Others
   * Creates more organic transaction patterns
   * Intermediary keeps a random 1-5% for itself
   */
  async distributeTokensTwoHop(totalAmount: string, mode: DistributionMode): Promise<FundingResult> {
    const masterWallet = getMasterWallet();
    const wallets = await walletService.getAllWallets();
    const totalWei = parseTokens(totalAmount);
    const masterBalance = await getBalance(masterWallet.address);

    if (wallets.length < 2) {
      return {
        success: false,
        funded: 0,
        failed: 0,
        totalDistributed: '0',
        errors: ['Need at least 2 wallets for two-hop distribution'],
      };
    }

    if (masterBalance < totalWei) {
      return {
        success: false,
        funded: 0,
        failed: 0,
        totalDistributed: '0',
        errors: [`Insufficient master balance. Have: ${formatTokens(masterBalance)}, Need: ${totalAmount}`],
      };
    }

    // Step 1: Pick a random wallet as intermediary
    const intermediaryWallet = pickRandom(wallets);
    const intermediaryPrivateKey = walletService.getDecryptedPrivateKey(intermediaryWallet);
    const intermediarySigner = createWalletFromPrivateKey(intermediaryPrivateKey);

    // Step 2: Calculate intermediary's self-retention (random 1-5% of total)
    const retentionPercent = Math.floor(Math.random() * 5) + 1; // 1-5%
    const selfRetention = (totalWei * BigInt(retentionPercent)) / 100n;
    const amountToDistribute = totalWei - selfRetention;

    logger.info(`Two-hop distribution: Master -> ${intermediaryWallet.address.slice(0, 10)}... -> ${wallets.length - 1} wallets`);
    logger.info(`Intermediary keeping ${retentionPercent}% (${formatTokens(selfRetention)} VANRY) for self`);

    // Step 3: Transfer total amount to intermediary (plus gas buffer for subsequent txs)
    const gasBuffer = parseTokens('1'); // 1 VANRY buffer for gas costs
    const amountToIntermediary = totalWei + gasBuffer;

    try {
      logger.info(`Transferring ${formatTokens(amountToIntermediary)} VANRY to intermediary...`);
      const txToIntermediary = await sendTransaction(masterWallet, intermediaryWallet.address, amountToIntermediary);
      await txToIntermediary.wait();
      logger.info(`Transferred ${formatTokens(amountToIntermediary)} to intermediary ${intermediaryWallet.address.slice(0, 10)}...`);
    } catch (error: any) {
      return {
        success: false,
        funded: 0,
        failed: 0,
        totalDistributed: '0',
        errors: [`Failed to fund intermediary wallet: ${error.message}`],
      };
    }

    // Update intermediary balance
    await walletService.updateBalance(intermediaryWallet.address);

    // Step 4: Distribute remaining amount from intermediary to all other wallets
    const recipientWallets = wallets.filter(w => w.address !== intermediaryWallet.address);
    const amounts = this.calculateDistribution(amountToDistribute, recipientWallets.length, mode);

    const errors: string[] = [];
    let funded = 0;
    let failed = 0;
    let totalDistributed = 0n;

    logger.info(`Distributing ${formatTokens(amountToDistribute)} VANRY from intermediary to ${recipientWallets.length} wallets...`);

    // Emit initial progress
    emitFundingProgress({ funded: 0, total: recipientWallets.length });

    for (let i = 0; i < recipientWallets.length; i++) {
      const recipient = recipientWallets[i];
      const amount = amounts[i];

      if (amount === 0n) continue;

      try {
        const tx = await sendTransaction(intermediarySigner, recipient.address, amount);
        await tx.wait();

        funded++;
        totalDistributed += amount;
        logger.debug(`Funded wallet ${recipient.index}: ${formatTokens(amount)} VANRY`);

        // Emit progress update
        emitFundingProgress({ funded, total: recipientWallets.length, current: recipient.address });
      } catch (error: any) {
        failed++;
        errors.push(`Failed to fund ${recipient.address}: ${error.message}`);
        logger.error(`Failed to fund wallet ${recipient.index}`, { error: error.message });

        // Emit progress even on failure
        emitFundingProgress({ funded, total: recipientWallets.length, current: recipient.address });
      }
    }

    // Emit completion
    emitFundingProgress({ funded: -1, total: recipientWallets.length });

    // Update all balances
    await walletService.updateAllBalances();

    // Include intermediary's self-retention in total distributed count
    const totalWithRetention = totalDistributed + selfRetention;

    logger.info(`Two-hop distribution complete. Funded: ${funded}, Failed: ${failed}, Intermediary kept: ${formatTokens(selfRetention)}`);

    return {
      success: failed === 0,
      funded: funded + 1, // +1 for intermediary who kept funds
      failed,
      totalDistributed: formatTokens(totalWithRetention),
      errors,
    };
  }

  private calculateDistribution(total: bigint, count: number, mode: DistributionMode): bigint[] {
    if (mode === 'equal') {
      const perWallet = total / BigInt(count);
      return Array(count).fill(perWallet);
    }

    // Random distribution with minimum guarantee
    const minPerWallet = parseTokens('5');
    const amounts: bigint[] = [];
    let remaining = total;

    // First pass: ensure minimum for all
    const totalMin = minPerWallet * BigInt(count);
    if (totalMin > total) {
      // Not enough for minimum, distribute equally
      const perWallet = total / BigInt(count);
      return Array(count).fill(perWallet);
    }

    // Give each wallet the minimum
    for (let i = 0; i < count; i++) {
      amounts.push(minPerWallet);
      remaining -= minPerWallet;
    }

    // Distribute remaining randomly
    while (remaining > 0n) {
      const randomIndex = Math.floor(Math.random() * count);
      const randomAmount = remaining > parseTokens('1')
        ? BigInt(Math.floor(Math.random() * Number(parseTokens('1'))))
        : remaining;

      amounts[randomIndex] += randomAmount;
      remaining -= randomAmount;
    }

    return amounts;
  }

  async checkAutoFundNeeded(): Promise<{
    needed: boolean;
    lowBalanceCount: number;
    percentage: number;
  }> {
    const wallets = await walletService.getAllWallets();
    const minBalance = parseTokens(config.autoFundMinBalance);
    let lowBalanceCount = 0;

    for (const wallet of wallets) {
      if (BigInt(wallet.balance) < minBalance) {
        lowBalanceCount++;
      }
    }

    const percentage = lowBalanceCount / wallets.length;

    return {
      needed: percentage >= config.autoFundThreshold,
      lowBalanceCount,
      percentage: percentage * 100,
    };
  }

  async executeAutoFund(): Promise<FundingResult | null> {
    const { needed, lowBalanceCount, percentage } = await this.checkAutoFundNeeded();

    if (!needed) {
      logger.debug(`Auto-fund not needed. Low balance: ${percentage.toFixed(1)}%`);
      return null;
    }

    logger.info(`Auto-fund triggered. ${lowBalanceCount} wallets below threshold (${percentage.toFixed(1)}%)`);

    return this.fundLowBalanceWallets();
  }

  async fundLowBalanceWallets(): Promise<FundingResult> {
    const masterWallet = getMasterWallet();
    const wallets = await walletService.getAllWallets();
    const minBalance = parseTokens(config.autoFundMinBalance);
    const targetBalance = parseTokens(config.minWalletBalance);
    const masterBalance = await getBalance(masterWallet.address);

    const errors: string[] = [];
    let funded = 0;
    let failed = 0;
    let totalDistributed = 0n;

    // Find wallets needing funding
    const needsFunding = wallets.filter(w => BigInt(w.balance) < minBalance);

    // Calculate total needed
    let totalNeeded = 0n;
    for (const wallet of needsFunding) {
      totalNeeded += targetBalance - BigInt(wallet.balance);
    }

    if (masterBalance < totalNeeded) {
      logger.warn(`Master wallet has insufficient funds. Have: ${formatTokens(masterBalance)}, Need: ${formatTokens(totalNeeded)}`);
    }

    for (const wallet of needsFunding) {
      const currentBalance = BigInt(wallet.balance);
      const amount = targetBalance - currentBalance;

      if (amount <= 0n) continue;

      try {
        const tx = await sendTransaction(masterWallet, wallet.address, amount);
        await tx.wait();

        funded++;
        totalDistributed += amount;
        await walletService.updateBalance(wallet.address);
        logger.debug(`Auto-funded wallet ${wallet.index}: ${formatTokens(amount)} VANRY`);
      } catch (error: any) {
        failed++;
        errors.push(`Failed to fund ${wallet.address}: ${error.message}`);
        logger.error(`Failed to auto-fund wallet ${wallet.index}`, { error: error.message });
      }
    }

    logger.info(`Auto-fund complete. Funded: ${funded}, Failed: ${failed}, Total: ${formatTokens(totalDistributed)}`);

    return {
      success: failed === 0,
      funded,
      failed,
      totalDistributed: formatTokens(totalDistributed),
      errors,
    };
  }
}

export const fundingService = new FundingService();
