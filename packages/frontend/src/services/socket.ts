import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store';

let socket: Socket | null = null;

export function connectSocket(): void {
  if (socket?.connected) return;

  socket = io({
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    useAppStore.getState().setConnected(true);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
    useAppStore.getState().setConnected(false);
  });

  socket.on('authenticated', (success: boolean) => {
    useAppStore.getState().setAuthenticated(success);
  });

  socket.on('live-stats', (stats) => {
    useAppStore.getState().setLiveStats(stats);
  });

  socket.on('recent-transactions', (transactions) => {
    useAppStore.getState().setRecentTransactions(transactions);
  });

  socket.on('new-transaction', (transaction) => {
    useAppStore.getState().addTransaction(transaction);
  });

  socket.on('instance-stats', (stats) => {
    useAppStore.getState().setInstanceStats(stats);
  });

  socket.on('simulator-mode', (enabled: boolean) => {
    console.log('Simulator mode:', enabled);
    useAppStore.getState().setSimulatorMode(enabled);
  });

  socket.on('wallets-changed', () => {
    useAppStore.getState().triggerWalletsRefresh();
  });

  socket.on('clear-transactions', () => {
    console.log('Clearing transaction feed');
    useAppStore.getState().clearTransactions();
  });

  socket.on('funding-progress', (progress: { funded: number; total: number; current?: string }) => {
    if (progress.funded === -1) {
      // Funding complete, clear progress after a short delay
      setTimeout(() => {
        useAppStore.getState().setFundingProgress(null);
      }, 2000);
    } else {
      useAppStore.getState().setFundingProgress(progress);
    }
  });
}

export function authenticate(password: string): void {
  socket?.emit('authenticate', password);
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
