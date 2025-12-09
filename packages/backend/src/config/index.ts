import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  // Database
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tx-generator',

  // Blockchain
  vanarRpcUrl: process.env.VANAR_RPC_URL || 'https://rpc.vanarchain.com',
  masterPrivateKey: process.env.MASTER_PRIVATE_KEY || '',
  chainId: 2040,
  chainName: 'Vanar Mainnet',
  symbol: 'VANRY',
  explorer: 'https://explorer.vanarchain.com',

  // App Config
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Authentication
  dashboardPassword: process.env.DASHBOARD_PASSWORD || 'admin',

  // Encryption
  walletEncryptionKey: process.env.WALLET_ENCRYPTION_KEY || 'default-32-char-key-for-dev-only',

  // Auto-funding
  autoFundThreshold: parseFloat(process.env.AUTO_FUND_THRESHOLD || '0.3'),
  autoFundMinBalance: parseFloat(process.env.AUTO_FUND_MIN_BALANCE || '5'),
  autoFundAmount: parseFloat(process.env.AUTO_FUND_AMOUNT || '1000'),

  // Transaction Config
  minWalletBalance: parseFloat(process.env.MIN_WALLET_BALANCE || '8'),
  maxTxAmount: parseFloat(process.env.MAX_TX_AMOUNT || '2'),
  txDelayMin: parseInt(process.env.TX_DELAY_MIN || '3000', 10),
  txDelayMax: parseInt(process.env.TX_DELAY_MAX || '5000', 10),

  // Instance Config
  maxInstances: parseInt(process.env.MAX_INSTANCES || '10', 10),
};

export type Config = typeof config;
