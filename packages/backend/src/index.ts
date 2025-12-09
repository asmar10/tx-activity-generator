import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { connectDatabase } from './database/connection';
import routes from './routes';
import { initializeSocket, closeSocket } from './socket';
import { instanceManager } from './services';
import logger from './utils/logger';

async function main(): Promise<void> {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Simple password auth middleware for API
  if (config.dashboardPassword && config.dashboardPassword !== 'admin') {
    app.use('/api', (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${config.dashboardPassword}`) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      next();
    });
  }

  // Routes
  app.use('/api', routes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Connect to database
  await connectDatabase();

  // Initialize Socket.IO
  initializeSocket(server);

  // Start server
  server.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Chain: ${config.chainName} (${config.chainId})`);
  });

  // Graceful shutdown
  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down...');
    await instanceManager.stopAllInstances();
    closeSocket();
    server.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
