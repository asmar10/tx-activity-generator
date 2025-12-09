import { walletService } from './wallet.service';
import { getMasterWallet, getBalance, sendTransaction, parseTokens, formatTokens } from '../utils/blockchain';
import { config } from '../config';
import logger from '../utils/logger';

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
      } catch (error: any) {
        failed++;
        errors.push(`Failed to fund ${wallet.address}: ${error.message}`);
        logger.error(`Failed to fund wallet ${wallet.index}`, { error: error.message });
      }
    }

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
