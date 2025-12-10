import { Router } from 'express';
import { walletController, fundingController, instanceController, statsController } from '../controllers';
import { simulatorController } from '../controllers/simulator.controller';

const router = Router();

// Wallet routes
router.get('/wallets', walletController.getAllWallets);
router.post('/wallets/generate', walletController.generateWallets);
router.get('/wallets/stats', walletController.getWalletStats);
router.post('/wallets/refresh', walletController.refreshBalances);

// Funding routes
router.get('/funding/master-balance', fundingController.getMasterBalance);
router.post('/funding/distribute', fundingController.distribute);
router.post('/funding/auto/enable', fundingController.enableAutoFund);
router.post('/funding/auto/disable', fundingController.disableAutoFund);
router.get('/funding/auto/status', fundingController.getAutoFundStatus);

// Instance routes
router.get('/instances', instanceController.listInstances);
router.post('/instances/start', instanceController.startInstance);
router.post('/instances/stop/:id', instanceController.stopInstance);
router.post('/instances/set-count', instanceController.setInstanceCount);
router.post('/instances/stop-all', instanceController.stopAllInstances);
router.post('/instances/reset', instanceController.reset);

// Stats routes
router.get('/stats/live', statsController.getLiveStats);
router.get('/stats/history', statsController.getHistoricalStats);
router.get('/stats/transactions', statsController.getRecentTransactions);

// Simulator routes
router.get('/simulator/status', simulatorController.getStatus);
router.post('/simulator/enable', simulatorController.enable);
router.post('/simulator/disable', simulatorController.disable);
router.get('/simulator/transactions', simulatorController.getTransactions);
router.post('/simulator/reset', simulatorController.reset);

export default router;
