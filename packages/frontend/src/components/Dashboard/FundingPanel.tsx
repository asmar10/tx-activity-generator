import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input } from '../ui';
import { useAppStore } from '../../store';
import { fundingApi } from '../../services/api';

export function FundingPanel() {
  const { liveStats, simulatorMode, darkMode, fundingProgress } = useAppStore();
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'equal' | 'random'>('equal');
  const [twoHop, setTwoHop] = useState(true); // Default to two-hop distribution
  const queryClient = useQueryClient();

  const { data: autoFundStatus } = useQuery({
    queryKey: ['autoFundStatus'],
    queryFn: fundingApi.getAutoFundStatus,
    refetchInterval: 10000,
  });

  const distributeMutation = useMutation({
    mutationFn: () => fundingApi.distribute(amount, mode, twoHop),
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

  const masterBalance = liveStats?.masterWallet?.balance || '0';

  // Show disabled state in simulator mode
  if (simulatorMode) {
    return (
      <Card title="FUNDING">
        <div className="space-y-4">
          <div className={`border-2 border-brutal-yellow p-4 text-center ${darkMode ? 'bg-brutal-yellow/20' : 'bg-yellow-100'}`}>
            <span className={`font-bold ${darkMode ? 'text-brutal-yellow' : 'text-yellow-700'}`}>SIMULATOR MODE</span>
            <p className={`text-sm mt-1 ${darkMode ? 'text-brutal-gray' : 'text-yellow-600'}`}>
              Funding is disabled in simulator mode.
              <br />
              Switch to Mainnet to access funding features.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="FUNDING">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className={`font-bold ${darkMode ? 'text-brutal-gray' : 'text-gray-700'}`}>Master Balance:</span>
          <span className={`text-xl font-extrabold ${darkMode ? 'text-brutal-cyan' : 'text-brutal-black'}`}>
            {parseFloat(masterBalance).toFixed(2)} VANRY
          </span>
        </div>

        <div className={`border-t-2 my-4 ${darkMode ? 'border-brutal-dark-border' : 'border-brutal-black'}`} />

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
                className={`w-5 h-5 ${darkMode ? 'accent-brutal-cyan' : 'accent-brutal-black'}`}
              />
              <span className={`font-bold uppercase ${darkMode ? 'text-white' : 'text-brutal-black'}`}>Equal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === 'random'}
                onChange={() => setMode('random')}
                className={`w-5 h-5 ${darkMode ? 'accent-brutal-cyan' : 'accent-brutal-black'}`}
              />
              <span className={`font-bold uppercase ${darkMode ? 'text-white' : 'text-brutal-black'}`}>Random</span>
            </label>
          </div>

          {/* Two-hop distribution toggle */}
          <label className={`flex items-center gap-2 cursor-pointer p-2 border ${
            darkMode ? 'bg-brutal-dark border-brutal-dark-border' : 'bg-gray-100 border-brutal-black'
          }`}>
            <input
              type="checkbox"
              checked={twoHop}
              onChange={(e) => setTwoHop(e.target.checked)}
              className={`w-5 h-5 ${darkMode ? 'accent-brutal-cyan' : 'accent-brutal-black'}`}
            />
            <div>
              <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-brutal-black'}`}>Two-hop Distribution</span>
              <p className={`text-xs ${darkMode ? 'text-brutal-gray' : 'text-gray-600'}`}>
                Master → Random Wallet → Others (more organic)
              </p>
            </div>
          </label>

          {/* Funding Progress */}
          {fundingProgress && (
            <div className={`border-2 p-3 ${darkMode ? 'border-brutal-dark-border bg-brutal-dark' : 'border-brutal-black bg-gray-100'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`font-bold text-sm ${darkMode ? 'text-brutal-gray' : 'text-gray-700'}`}>
                  Funding Progress
                </span>
                <span className={`font-bold ${darkMode ? 'text-brutal-cyan' : 'text-brutal-black'}`}>
                  {fundingProgress.funded} / {fundingProgress.total}
                </span>
              </div>
              <div className={`h-4 border-2 relative ${darkMode ? 'border-brutal-dark-border bg-brutal-dark' : 'border-brutal-black bg-gray-200'}`}>
                <div
                  className="h-full bg-brutal-green transition-all"
                  style={{ width: `${(fundingProgress.funded / fundingProgress.total) * 100}%` }}
                />
              </div>
              {fundingProgress.current && (
                <div className={`text-xs mt-1 font-mono truncate ${darkMode ? 'text-brutal-gray' : 'text-gray-600'}`}>
                  Current: {fundingProgress.current.slice(0, 10)}...
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => distributeMutation.mutate()}
            disabled={distributeMutation.isPending || !amount || fundingProgress !== null}
            className="w-full"
          >
            {fundingProgress ? `FUNDING ${fundingProgress.funded}/${fundingProgress.total}...` : distributeMutation.isPending ? 'DISTRIBUTING...' : 'DISTRIBUTE NOW'}
          </Button>
        </div>

        <div className={`border-t-2 my-4 ${darkMode ? 'border-brutal-dark-border' : 'border-brutal-black'}`} />

        {/* Auto-Fund */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`font-bold ${darkMode ? 'text-brutal-gray' : 'text-gray-700'}`}>Auto-Fund:</span>
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

          <div className={`text-sm space-y-1 ${darkMode ? 'text-brutal-gray' : 'text-gray-600'}`}>
            <div className="flex justify-between">
              <span>Threshold:</span>
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-brutal-black'}`}>30% wallets &lt; 5 tokens</span>
            </div>
            <div className="flex justify-between">
              <span>Low Balance Count:</span>
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-brutal-black'}`}>{autoFundStatus?.lowBalanceCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Percentage:</span>
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-brutal-black'}`}>
                {(autoFundStatus?.percentage || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
