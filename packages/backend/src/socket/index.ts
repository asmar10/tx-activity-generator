import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config';
import { statsService, instanceManager, transactionService } from '../services';
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

  // Broadcast live stats every 5 seconds
  statsInterval = setInterval(async () => {
    if (io && io.sockets.adapter.rooms.get('dashboard')?.size) {
      try {
        const stats = await statsService.getLiveStats();
        io.to('dashboard').emit('live-stats', stats);
      } catch (error) {
        logger.error('Failed to broadcast stats', { error });
      }
    }
  }, 5000);

  logger.info('Socket.IO initialized');
  return io;
}

function joinDashboard(socket: Socket): void {
  socket.join('dashboard');

  // Send initial stats
  statsService.getLiveStats().then((stats) => {
    socket.emit('live-stats', stats);
  });

  // Send recent transactions
  transactionService.getRecentTransactions(20).then((transactions) => {
    socket.emit('recent-transactions', transactions);
  });

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
