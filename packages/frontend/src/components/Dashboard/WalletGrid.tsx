import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button } from '../ui';
import { walletApi } from '../../services/api';

interface Wallet {
  address: string;
  index: number;
  balance: string;
  totalTxSent: number;
  totalTxReceived: number;
}

export function WalletGrid() {
  const queryClient = useQueryClient();

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

  const getStatusLabel = (balance: string): string => {
    const bal = parseFloat(balance);
    if (bal >= 8) return 'HEALTHY';
    if (bal >= 1) return 'LOW';
    return 'EMPTY';
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
        <div className="text-center py-8 font-bold">Loading wallets...</div>
      ) : !wallets || wallets.length === 0 ? (
        <div className="text-center py-8">
          <p className="font-bold mb-4">No wallets generated yet</p>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            Generate 100 Wallets
          </Button>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex gap-4 mb-4 text-xs font-bold">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 border-2 border-brutal-black bg-brutal-green" />
              <span>HEALTHY (&ge;8)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 border-2 border-brutal-black bg-brutal-yellow" />
              <span>LOW (1-8)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 border-2 border-brutal-black bg-brutal-red" />
              <span>EMPTY (&lt;1)</span>
            </div>
          </div>

          {/* Wallet grid */}
          <div className="grid grid-cols-10 gap-1 max-h-64 overflow-y-auto">
            {wallets.map((wallet: Wallet) => (
              <div
                key={wallet.address}
                className={`border-2 border-brutal-black p-1 text-center ${getStatusColor(
                  wallet.balance
                )} cursor-pointer hover:border-4 transition-all`}
                title={`${wallet.address}\nBalance: ${wallet.balance} VANRY\nSent: ${wallet.totalTxSent}\nReceived: ${wallet.totalTxReceived}`}
              >
                <div className="text-xs font-extrabold">
                  {String(wallet.index).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-mono truncate">
                  {parseFloat(wallet.balance).toFixed(1)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="flex justify-between mt-4 text-sm font-bold border-t-4 border-brutal-black pt-4">
            <span>
              Healthy: {wallets.filter((w: Wallet) => parseFloat(w.balance) >= 8).length}
            </span>
            <span>
              Low: {wallets.filter((w: Wallet) => parseFloat(w.balance) >= 1 && parseFloat(w.balance) < 8).length}
            </span>
            <span>
              Empty: {wallets.filter((w: Wallet) => parseFloat(w.balance) < 1).length}
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
