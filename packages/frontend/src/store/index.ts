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

export interface FundingProgress {
  funded: number;
  total: number;
  current?: string;
}

interface AppState {
  isConnected: boolean;
  isAuthenticated: boolean;
  liveStats: LiveStats | null;
  recentTransactions: Transaction[];
  instanceStats: InstanceStats[];
  simulatorMode: boolean;
  walletsUpdatedAt: number;
  darkMode: boolean;
  fundingProgress: FundingProgress | null;
  setConnected: (connected: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLiveStats: (stats: LiveStats) => void;
  setRecentTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setInstanceStats: (stats: InstanceStats[]) => void;
  setSimulatorMode: (enabled: boolean) => void;
  triggerWalletsRefresh: () => void;
  toggleDarkMode: () => void;
  clearTransactions: () => void;
  setFundingProgress: (progress: FundingProgress | null) => void;
}

// Get initial dark mode from localStorage or default to true (dark)
const getInitialDarkMode = (): boolean => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return stored === 'true';
    }
  }
  return true; // Default to dark mode
};

export const useAppStore = create<AppState>((set) => ({
  isConnected: false,
  isAuthenticated: false,
  liveStats: null,
  recentTransactions: [],
  instanceStats: [],
  simulatorMode: false,
  walletsUpdatedAt: 0,
  darkMode: getInitialDarkMode(),
  fundingProgress: null,
  setConnected: (connected) => set({ isConnected: connected }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setLiveStats: (stats) => set({ liveStats: stats }),
  setRecentTransactions: (transactions) => set({ recentTransactions: transactions }),
  addTransaction: (transaction) =>
    set((state) => {
      // Prevent duplicates by checking txHash
      if (state.recentTransactions.some((tx) => tx.txHash === transaction.txHash)) {
        return state;
      }
      return {
        recentTransactions: [transaction, ...state.recentTransactions].slice(0, 50),
      };
    }),
  setInstanceStats: (stats) => set({ instanceStats: stats }),
  setSimulatorMode: (enabled) =>
    set({
      simulatorMode: enabled,
      // Clear transactions when switching modes
      recentTransactions: [],
    }),
  triggerWalletsRefresh: () => set({ walletsUpdatedAt: Date.now() }),
  toggleDarkMode: () =>
    set((state) => {
      const newDarkMode = !state.darkMode;
      localStorage.setItem('darkMode', String(newDarkMode));
      return { darkMode: newDarkMode };
    }),
  clearTransactions: () => set({ recentTransactions: [] }),
  setFundingProgress: (progress) => set({ fundingProgress: progress }),
}));
