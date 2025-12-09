import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input } from '../ui';
import { useAppStore } from '../../store';
import { fundingApi } from '../../services/api';

export function FundingPanel() {
  const { liveStats } = useAppStore();
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'equal' | 'random'>('equal');
  const queryClient = useQueryClient();

  const { data: autoFundStatus } = useQuery({
    queryKey: ['autoFundStatus'],
    queryFn: fundingApi.getAutoFundStatus,
    refetchInterval: 10000,
  });

  const distributeMutation = useMutation({
    mutationFn: () => fundingApi.distribute(amount, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setAmount('');
    },
  });

  const enableAutoFundMutation = useMutation({
    mutationFn: fundingApi.enableAutoFund,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['autoFundStatus'] }),
  });

  const disableAutoFundMutation = useMutation({
    mutationFn: fundingApi.disableAutoFund,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['autoFundStatus'] }),
  });

  const masterBalance = liveStats?.masterWallet.balance || '0';

  return (
    <Card title="FUNDING">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-bold">Master Balance:</span>
          <span className="text-xl font-extrabold">
            {parseFloat(masterBalance).toFixed(2)} VANRY
          </span>
        </div>

        <div className="brutal-divider" />

        {/* Manual Distribution */}
        <div className="space-y-3">
          <Input
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Total VANRY to distribute"
          />

          <div className="flex gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === 'equal'}
                onChange={() => setMode('equal')}
                className="w-5 h-5 accent-brutal-black"
              />
              <span className="font-bold uppercase">Equal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === 'random'}
                onChange={() => setMode('random')}
                className="w-5 h-5 accent-brutal-black"
              />
              <span className="font-bold uppercase">Random</span>
            </label>
          </div>

          <Button
            onClick={() => distributeMutation.mutate()}
            disabled={distributeMutation.isPending || !amount}
            className="w-full"
          >
            {distributeMutation.isPending ? 'DISTRIBUTING...' : 'DISTRIBUTE NOW'}
          </Button>
        </div>

        <div className="brutal-divider" />

        {/* Auto-Fund */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold">Auto-Fund:</span>
            <Button
              size="sm"
              variant={autoFundStatus?.enabled ? 'danger' : 'success'}
              onClick={() =>
                autoFundStatus?.enabled
                  ? disableAutoFundMutation.mutate()
                  : enableAutoFundMutation.mutate()
              }
              disabled={enableAutoFundMutation.isPending || disableAutoFundMutation.isPending}
            >
              {autoFundStatus?.enabled ? 'ON' : 'OFF'}
            </Button>
          </div>

          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Threshold:</span>
              <span className="font-bold">30% wallets &lt; 5 tokens</span>
            </div>
            <div className="flex justify-between">
              <span>Low Balance Count:</span>
              <span className="font-bold">{autoFundStatus?.lowBalanceCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Percentage:</span>
              <span className="font-bold">
                {(autoFundStatus?.percentage || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
