import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button } from '../ui';
import { walletApi } from '../../services/api';
import { useAppStore } from '../../store';

interface Wallet {
  address: string;
  index: number;
  balance: string;
  totalTxSent: number;
  totalTxReceived: number;
}

export function WalletGrid() {
  const queryClient = useQueryClient();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { walletsUpdatedAt, darkMode } = useAppStore();

  // Refetch wallets when signaled by socket
  useEffect(() => {
    if (walletsUpdatedAt > 0) {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    }
  }, [walletsUpdatedAt, queryClient]);

  const copyToClipboard = async (address: string, index: number) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: walletApi.getAll,
    refetchInterval: 30000,
  });

  const refreshMutation = useMutation({
    mutationFn: walletApi.refreshBalances,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallets'] }),
  });

  const generateMutation = useMutation({
    mutationFn: () => walletApi.generate(100),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallets'] }),
  });

  const getStatusColor = (balance: string): string => {
    const bal = parseFloat(balance);
    if (bal >= 8) return 'bg-brutal-green';
    if (bal >= 1) return 'bg-brutal-yellow';
    return 'bg-brutal-red';
  };

  return (
    <Card
      title={`WALLETS (${wallets?.length || 0})`}
      headerRight={
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            {refreshMutation.isPending ? '...' : 'REFRESH'}
          </Button>
          {(!wallets || wallets.length === 0) && (
            <Button
              size="sm"
              variant="success"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? 'GENERATING...' : 'GENERATE 100'}
            </Button>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className={`text-center py-8 font-bold ${darkMode ? 'text-brutal-gray' : 'text-gray-500'}`}>Loading wallets...</div>
      ) : !wallets || wallets.length === 0 ? (
        <div className="text-center py-8">
          <p className={`font-bold mb-4 ${darkMode ? 'text-brutal-gray' : 'text-gray-500'}`}>No wallets generated yet</p>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            Generate 100 Wallets
          </Button>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className={`flex gap-4 mb-4 text-xs font-bold ${darkMode ? 'text-brutal-gray' : 'text-gray-600'}`}>
            <div className="flex items-center gap-1">
              <div className={`w-4 h-4 border bg-brutal-green ${darkMode ? 'border-brutal-dark-border' : 'border-brutal-black'}`} />
              <span>HEALTHY (&ge;8)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-4 h-4 border bg-brutal-yellow ${darkMode ? 'border-brutal-dark-border' : 'border-brutal-black'}`} />
              <span>LOW (1-8)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-4 h-4 border bg-brutal-red ${darkMode ? 'border-brutal-dark-border' : 'border-brutal-black'}`} />
              <span>EMPTY (&lt;1)</span>
            </div>
          </div>

          {/* Wallet grid */}
          <div className="grid grid-cols-10 gap-1 max-h-64 overflow-y-auto">
            {wallets.map((wallet: Wallet) => (
              <div
                key={wallet.address}
                className={`border p-1 text-center ${getStatusColor(wallet.balance)} cursor-pointer hover:border-2 transition-all relative ${
                  darkMode ? 'border-brutal-dark-border hover:border-white' : 'border-brutal-black hover:border-brutal-cyan'
                }`}
                title={`${wallet.address}\nBalance: ${wallet.balance} VANRY\nSent: ${wallet.totalTxSent}\nReceived: ${wallet.totalTxReceived}\n\nClick to copy address`}
                onClick={() => copyToClipboard(wallet.address, wallet.index)}
              >
                {copiedIndex === wallet.index && (
                  <div className="absolute inset-0 bg-brutal-cyan text-black flex items-center justify-center text-[8px] font-bold">
                    COPIED!
                  </div>
                )}
                <div className="text-xs font-extrabold text-black">
                  {String(wallet.index).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-mono truncate text-black">
                  {parseFloat(wallet.balance).toFixed(1)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className={`flex justify-between mt-4 text-sm font-bold border-t-2 pt-4 ${
            darkMode ? 'border-brutal-dark-border text-brutal-gray' : 'border-brutal-black text-gray-600'
          }`}>
            <span>
              <span className="text-brutal-green">Healthy:</span> {wallets.filter((w: Wallet) => parseFloat(w.balance) >= 8).length}
            </span>
            <span>
              <span className="text-brutal-yellow">Low:</span> {wallets.filter((w: Wallet) => parseFloat(w.balance) >= 1 && parseFloat(w.balance) < 8).length}
            </span>
            <span>
              <span className="text-brutal-red">Empty:</span> {wallets.filter((w: Wallet) => parseFloat(w.balance) < 1).length}
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
