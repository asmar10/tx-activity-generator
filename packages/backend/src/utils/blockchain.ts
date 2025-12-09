import { ethers, JsonRpcProvider, Wallet, HDNodeWallet } from 'ethers';
import { config } from '../config';
import logger from './logger';

let provider: JsonRpcProvider | null = null;
let masterWallet: Wallet | null = null;

export function getProvider(): JsonRpcProvider {
  if (!provider) {
    provider = new JsonRpcProvider(config.vanarRpcUrl, {
      chainId: config.chainId,
      name: config.chainName,
    });
    logger.info(`Connected to ${config.chainName} at ${config.vanarRpcUrl}`);
  }
  return provider;
}

export function getMasterWallet(): Wallet {
  if (!masterWallet) {
    if (!config.masterPrivateKey) {
      throw new Error('Master private key not configured');
    }
    masterWallet = new Wallet(config.masterPrivateKey, getProvider());
    logger.info(`Master wallet initialized: ${masterWallet.address}`);
  }
  return masterWallet;
}

export function createWalletFromPrivateKey(privateKey: string): Wallet {
  return new Wallet(privateKey, getProvider());
}

export async function getBalance(address: string): Promise<bigint> {
  const p = getProvider();
  return p.getBalance(address);
}

export async function sendTransaction(
  fromWallet: Wallet,
  toAddress: string,
  amount: bigint
): Promise<ethers.TransactionResponse> {
  const tx = await fromWallet.sendTransaction({
    to: toAddress,
    value: amount,
  });
  return tx;
}

export function parseTokens(amount: string | number): bigint {
  return ethers.parseEther(amount.toString());
}

export function formatTokens(amount: bigint): string {
  return ethers.formatEther(amount);
}

export function generateRandomWallet(): HDNodeWallet {
  return Wallet.createRandom();
}
