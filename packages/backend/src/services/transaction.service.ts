import { Transaction, ITransaction } from '../database/models';
import { walletService } from './wallet.service';
import { createWalletFromPrivateKey, sendTransaction, parseTokens, formatTokens } from '../utils/blockchain';
import { pickRandom, pickRandomExcluding, calculateTransferAmount } from '../utils/random';
import { config } from '../config';
import logger from '../utils/logger';

export enum TxError {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
  NONCE_TOO_LOW = 'NONCE_TOO_LOW',
  TX_UNDERPRICED = 'TX_UNDERPRICED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: TxError;
  errorMessage?: string;
}

export class TransactionService {
  async executeRandomTransaction(instanceId: string): Promise<TransactionResult> {
    const minBalance = parseTokens(config.minWalletBalance);
    const eligibleWallets = await walletService.getEligibleWallets(minBalance);

    if (eligibleWallets.length < 2) {
      logger.warn('Not enough eligible wallets for transaction');
      return { success: false, error: TxError.INSUFFICIENT_BALANCE };
    }

    const senderWallet = pickRandom(eligibleWallets);
    const receiverWallet = pickRandomExcluding(eligibleWallets, senderWallet);

    const senderBalance = BigInt(senderWallet.balance);
    const transferAmount = calculateTransferAmount(senderBalance, minBalance);

    if (transferAmount === 0n) {
      logger.warn(`Sender ${senderWallet.address} has insufficient transferable balance`);
      return { success: false, error: TxError.INSUFFICIENT_BALANCE };
    }

    try {
      const privateKey = walletService.getDecryptedPrivateKey(senderWallet);
      const wallet = createWalletFromPrivateKey(privateKey);

      logger.info(`Executing tx: ${senderWallet.address} -> ${receiverWallet.address} (${formatTokens(transferAmount)} VANRY)`);

      const tx = await sendTransaction(wallet, receiverWallet.address, transferAmount);

      // Create pending transaction record
      await Transaction.create({
        txHash: tx.hash,
        from: senderWallet.address,
        to: receiverWallet.address,
        amount: transferAmount.toString(),
        status: 'pending',
        instanceId,
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      // Update transaction record
      await Transaction.updateOne(
        { txHash: tx.hash },
        {
          status: receipt?.status === 1 ? 'success' : 'failed',
          gasUsed: receipt?.gasUsed.toString() || '0',
        }
      );

      // Update wallet stats
      await walletService.incrementTxSent(senderWallet.address);
      await walletService.incrementTxReceived(receiverWallet.address);

      // Update balances
      await walletService.updateBalance(senderWallet.address);
      await walletService.updateBalance(receiverWallet.address);

      logger.info(`Transaction confirmed: ${tx.hash}`);
      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      const txError = this.classifyError(error);
      logger.error(`Transaction failed: ${txError}`, { error: error.message });

      return {
        success: false,
        error: txError,
        errorMessage: error.message,
      };
    }
  }

  private classifyError(error: any): TxError {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
      return TxError.INSUFFICIENT_BALANCE;
    }
    if (message.includes('gas')) {
      return TxError.GAS_ESTIMATION_FAILED;
    }
    if (message.includes('nonce')) {
      return TxError.NONCE_TOO_LOW;
    }
    if (message.includes('underpriced')) {
      return TxError.TX_UNDERPRICED;
    }
    if (message.includes('network') || message.includes('connection')) {
      return TxError.NETWORK_ERROR;
    }
    if (message.includes('timeout')) {
      return TxError.TIMEOUT;
    }

    return TxError.UNKNOWN;
  }

  async getRecentTransactions(limit: number = 50): Promise<ITransaction[]> {
    return Transaction.find()
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getTransactionsByInstance(instanceId: string, limit: number = 50): Promise<ITransaction[]> {
    return Transaction.find({ instanceId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getTransactionStats(): Promise<{
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: number;
  }> {
    const [total, successful, failed, pending] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: 'success' }),
      Transaction.countDocuments({ status: 'failed' }),
      Transaction.countDocuments({ status: 'pending' }),
    ]);

    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return { total, successful, failed, pending, successRate };
  }

  async getTodayStats(): Promise<{
    totalTx: number;
    successful: number;
    failed: number;
    volume: string;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = await Transaction.find({
      createdAt: { $gte: today },
    });

    let volume = 0n;
    let successful = 0;
    let failed = 0;

    for (const tx of transactions) {
      if (tx.status === 'success') {
        successful++;
        volume += BigInt(tx.amount);
      } else if (tx.status === 'failed') {
        failed++;
      }
    }

    return {
      totalTx: transactions.length,
      successful,
      failed,
      volume: formatTokens(volume),
    };
  }
}

export const transactionService = new TransactionService();
