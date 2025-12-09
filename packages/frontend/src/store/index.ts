import { create } from 'zustand';

export interface LiveStats {
  instances: {
    running: number;
    maxAllowed: number;
  };
  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: number;
  };
  today: {
    totalTx: number;
    successful: number;
    failed: number;
    volume: string;
  };
  wallets: {
    total: number;
    healthy: number;
    low: number;
    empty: number;
    totalBalance: string;
  };
  masterWallet: {
    address: string;
    balance: string;
  };
}

export interface Transaction {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}

export interface InstanceStats {
  id: string;
  startedAt: string;
  transactionsExecuted: number;
  lastTransactionAt: string | null;
  status: 'running' | 'stopped' | 'error';
}

interface AppState {
  isConnected: boolean;
  isAuthenticated: boolean;
  liveStats: LiveStats | null;
  recentTransactions: Transaction[];
  instanceStats: InstanceStats[];
  setConnected: (connected: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLiveStats: (stats: LiveStats) => void;
  setRecentTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setInstanceStats: (stats: InstanceStats[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isConnected: false,
  isAuthenticated: false,
  liveStats: null,
  recentTransactions: [],
  instanceStats: [],
  setConnected: (connected) => set({ isConnected: connected }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setLiveStats: (stats) => set({ liveStats: stats }),
  setRecentTransactions: (transactions) => set({ recentTransactions: transactions }),
  addTransaction: (transaction) =>
    set((state) => ({
      recentTransactions: [transaction, ...state.recentTransactions].slice(0, 50),
    })),
  setInstanceStats: (stats) => set({ instanceStats: stats }),
}));
