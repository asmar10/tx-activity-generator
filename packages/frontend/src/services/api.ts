const API_BASE = '/api';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'API request failed');
  }

  return data.data;
}

// Wallet API
export const walletApi = {
  getAll: () => fetchApi<any[]>('/wallets'),
  generate: (count = 100) =>
    fetchApi<{ count: number }>('/wallets/generate', {
      method: 'POST',
      body: JSON.stringify({ count }),
    }),
  getStats: () => fetchApi<any>('/wallets/stats'),
  refreshBalances: () =>
    fetchApi<void>('/wallets/refresh', { method: 'POST' }),
};

// Instance API
export const instanceApi = {
  list: () => fetchApi<{ running: number; instances: any[] }>('/instances'),
  start: () => fetchApi<{ instanceId: string }>('/instances/start', { method: 'POST' }),
  stop: (id: string) =>
    fetchApi<void>(`/instances/stop/${id}`, { method: 'POST' }),
  setCount: (count: number) =>
    fetchApi<{ targetCount: number; currentCount: number }>('/instances/set-count', {
      method: 'POST',
      body: JSON.stringify({ count }),
    }),
  stopAll: () =>
    fetchApi<void>('/instances/stop-all', { method: 'POST' }),
  reset: () =>
    fetchApi<{ message: string }>('/instances/reset', { method: 'POST' }),
};

// Funding API
export const fundingApi = {
  getMasterBalance: () =>
    fetchApi<{ address: string; balance: string }>('/funding/master-balance'),
  distribute: (totalAmount: string, mode: 'equal' | 'random', twoHop: boolean = true) =>
    fetchApi<any>('/funding/distribute', {
      method: 'POST',
      body: JSON.stringify({ totalAmount, mode, twoHop }),
    }),
  enableAutoFund: () =>
    fetchApi<void>('/funding/auto/enable', { method: 'POST' }),
  disableAutoFund: () =>
    fetchApi<void>('/funding/auto/disable', { method: 'POST' }),
  getAutoFundStatus: () =>
    fetchApi<{ enabled: boolean; needed: boolean; lowBalanceCount: number; percentage: number }>(
      '/funding/auto/status'
    ),
};

// Stats API
export const statsApi = {
  getLive: () => fetchApi<any>('/stats/live'),
  getHistory: (days = 7) =>
    fetchApi<any[]>(`/stats/history?days=${days}`),
  getTransactions: (limit = 50) =>
    fetchApi<any[]>(`/stats/transactions?limit=${limit}`),
};

// Simulator API
export const simulatorApi = {
  getStatus: () => fetchApi<{ enabled: boolean }>('/simulator/status'),
  enable: () => fetchApi<{ enabled: boolean; message: string }>('/simulator/enable', { method: 'POST' }),
  disable: () => fetchApi<{ enabled: boolean; message: string }>('/simulator/disable', { method: 'POST' }),
  getTransactions: (limit = 50) =>
    fetchApi<any[]>(`/simulator/transactions?limit=${limit}`),
  reset: () => fetchApi<{ message: string }>('/simulator/reset', { method: 'POST' }),
};
