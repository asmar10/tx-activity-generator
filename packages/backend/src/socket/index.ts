import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config';
import { statsService, instanceManager, transactionService } from '../services';
import { simulatorService } from '../services/simulator.service';
import logger from '../utils/logger';

let io: Server | null = null;
let statsInterval: NodeJS.Timeout | null = null;

export function initializeSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: config.nodeEnv === 'production' ? false : '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Authenticate if password is set
    if (config.dashboardPassword && config.dashboardPassword !== 'admin') {
      socket.on('authenticate', (password: string) => {
        if (password === config.dashboardPassword) {
          socket.emit('authenticated', true);
          joinDashboard(socket);
        } else {
          socket.emit('authenticated', false);
          socket.disconnect();
        }
      });
    } else {
      joinDashboard(socket);
    }

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  // Set up instance stats callback
  instanceManager.setStatsCallback((stats) => {
    if (io) {
      io.to('dashboard').emit('instance-stats', stats);
    }
  });

  // Set up transaction callback for real-time updates
  instanceManager.setTransactionCallback((tx) => {
    if (io) {
      io.to('dashboard').emit('new-transaction', tx);
      // Also signal that wallets have changed
      io.to('dashboard').emit('wallets-changed');
    }
  });

  // Set up simulator mode change callback
  simulatorService.setModeChangeCallback((enabled) => {
    if (io) {
      io.to('dashboard').emit('simulator-mode', enabled);
      logger.info(`Broadcasted simulator mode change: ${enabled}`);
    }
  });

  // Broadcast live stats every 2 seconds for faster updates
  statsInterval = setInterval(async () => {
    if (io && io.sockets.adapter.rooms.get('dashboard')?.size) {
      try {
        let stats;
        if (simulatorService.isEnabled()) {
          // Use mock stats in simulator mode
          stats = simulatorService.getMockLiveStats(config.maxInstances);
        } else {
          stats = await statsService.getLiveStats();
        }
        io.to('dashboard').emit('live-stats', stats);
      } catch (error) {
        logger.error('Failed to broadcast stats', { error });
      }
    }
  }, 2000);

  logger.info('Socket.IO initialized');
  return io;
}

function joinDashboard(socket: Socket): void {
  socket.join('dashboard');

  // Send simulator mode status first
  const isSimulator = simulatorService.isEnabled();
  socket.emit('simulator-mode', isSimulator);

  // Send initial stats based on mode (no historical transactions - only real-time)
  if (isSimulator) {
    socket.emit('live-stats', simulatorService.getMockLiveStats(config.maxInstances));
  } else {
    statsService.getLiveStats().then((stats) => {
      socket.emit('live-stats', stats);
    });
  }

  // Send instance stats
  socket.emit('instance-stats', instanceManager.getInstanceStats());
}

export function emitTransaction(tx: {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  status: string;
}): void {
  if (io) {
    io.to('dashboard').emit('new-transaction', tx);
  }
}

export function emitStatsUpdate(stats: any): void {
  if (io) {
    io.to('dashboard').emit('live-stats', stats);
  }
}

export function emitClearTransactions(): void {
  if (io) {
    io.to('dashboard').emit('clear-transactions');
  }
}

export function emitFundingProgress(progress: {
  funded: number;
  total: number;
  current?: string;
}): void {
  if (io) {
    io.to('dashboard').emit('funding-progress', progress);
  }
}

export function getIO(): Server | null {
  return io;
}

export function closeSocket(): void {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
  if (io) {
    io.close();
    io = null;
  }
}
