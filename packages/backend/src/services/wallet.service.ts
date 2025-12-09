import { Wallet as WalletModel, IWallet } from '../database/models';
import { generateRandomWallet, getBalance, formatTokens } from '../utils/blockchain';
import { encryptPrivateKey, decryptPrivateKey } from '../utils/encryption';
import logger from '../utils/logger';

export class WalletService {
  async generateWallets(count: number = 100): Promise<IWallet[]> {
    const existingCount = await WalletModel.countDocuments();
    if (existingCount >= count) {
      logger.warn(`Already have ${existingCount} wallets, skipping generation`);
      return this.getAllWallets();
    }

    const wallets: IWallet[] = [];
    const startIndex = existingCount;

    logger.info(`Generating ${count - existingCount} wallets starting from index ${startIndex}`);

    for (let i = startIndex; i < count; i++) {
      const wallet = generateRandomWallet();
      const encryptedKey = encryptPrivateKey(wallet.privateKey);

      const walletDoc = await WalletModel.create({
        address: wallet.address,
        privateKey: encryptedKey,
        index: i,
        balance: '0',
      });

      wallets.push(walletDoc);
      logger.debug(`Generated wallet ${i}: ${wallet.address}`);
    }

    logger.info(`Generated ${wallets.length} new wallets`);
    return this.getAllWallets();
  }

  async getAllWallets(): Promise<IWallet[]> {
    return WalletModel.find().sort({ index: 1 });
  }

  async getWalletByAddress(address: string): Promise<IWallet | null> {
    return WalletModel.findOne({ address });
  }

  async getWalletByIndex(index: number): Promise<IWallet | null> {
    return WalletModel.findOne({ index });
  }

  async getEligibleWallets(minBalance: bigint): Promise<IWallet[]> {
    const wallets = await this.getAllWallets();
    const eligible: IWallet[] = [];

    for (const wallet of wallets) {
      if (BigInt(wallet.balance) >= minBalance) {
        eligible.push(wallet);
      }
    }

    return eligible;
  }

  async updateBalance(address: string): Promise<string> {
    const balance = await getBalance(address);
    const balanceStr = balance.toString();

    await WalletModel.updateOne(
      { address },
      { balance: balanceStr, lastActive: new Date() }
    );

    return balanceStr;
  }

  async updateAllBalances(): Promise<void> {
    const wallets = await this.getAllWallets();
    logger.info(`Updating balances for ${wallets.length} wallets`);

    for (const wallet of wallets) {
      try {
        await this.updateBalance(wallet.address);
      } catch (error) {
        logger.error(`Failed to update balance for ${wallet.address}`, { error });
      }
    }

    logger.info('Balance update complete');
  }

  async incrementTxSent(address: string): Promise<void> {
    await WalletModel.updateOne(
      { address },
      { $inc: { totalTxSent: 1 }, lastActive: new Date() }
    );
  }

  async incrementTxReceived(address: string): Promise<void> {
    await WalletModel.updateOne(
      { address },
      { $inc: { totalTxReceived: 1 }, lastActive: new Date() }
    );
  }

  getDecryptedPrivateKey(wallet: IWallet): string {
    return decryptPrivateKey(wallet.privateKey);
  }

  async getWalletStats(): Promise<{
    total: number;
    healthy: number;
    low: number;
    empty: number;
    totalBalance: string;
  }> {
    const wallets = await this.getAllWallets();
    let healthy = 0;
    let low = 0;
    let empty = 0;
    let totalBalance = 0n;

    const minHealthy = BigInt(8e18); // 8 tokens
    const minLow = BigInt(1e18); // 1 token

    for (const wallet of wallets) {
      const balance = BigInt(wallet.balance);
      totalBalance += balance;

      if (balance >= minHealthy) {
        healthy++;
      } else if (balance >= minLow) {
        low++;
      } else {
        empty++;
      }
    }

    return {
      total: wallets.length,
      healthy,
      low,
      empty,
      totalBalance: formatTokens(totalBalance),
    };
  }
}

export const walletService = new WalletService();
