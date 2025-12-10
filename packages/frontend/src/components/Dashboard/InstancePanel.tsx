import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input } from '../ui';
import { useAppStore } from '../../store';
import { instanceApi } from '../../services/api';

export function InstancePanel() {
  const { liveStats, instanceStats, darkMode } = useAppStore();
  const [targetCount, setTargetCount] = useState('');
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: instanceApi.start,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instances'] }),
  });

  const stopAllMutation = useMutation({
    mutationFn: instanceApi.stopAll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instances'] }),
  });

  const resetMutation = useMutation({
    mutationFn: instanceApi.reset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instances'] }),
  });

  const stopInstanceMutation = useMutation({
    mutationFn: (id: string) => instanceApi.stop(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instances'] }),
  });

  const setCountMutation = useMutation({
    mutationFn: (count: number) => instanceApi.setCount(count),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      setTargetCount('');
    },
  });

  const running = liveStats?.instances.running || 0;
  const maxAllowed = liveStats?.instances.maxAllowed || 10;

  const handleSetCount = () => {
    const count = parseInt(targetCount);
    if (!isNaN(count) && count >= 0 && count <= maxAllowed) {
      setCountMutation.mutate(count);
    }
  };

  return (
    <Card
      title="INSTANCES"
      headerRight={
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending || running >= maxAllowed}
          >
            +
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => stopAllMutation.mutate()}
            disabled={stopAllMutation.isPending || running === 0}
          >
            STOP ALL
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
          >
            RESET
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className={`font-bold ${darkMode ? 'text-brutal-gray' : 'text-gray-700'}`}>Running:</span>
          <span className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-brutal-black'}`}>
            {running} / {maxAllowed}
          </span>
        </div>

        {/* Progress bar */}
        <div className={`h-8 border-2 relative ${darkMode ? 'border-brutal-dark-border bg-brutal-dark' : 'border-brutal-black bg-gray-200'}`}>
          <div
            className="h-full bg-brutal-green transition-all"
            style={{ width: `${(running / maxAllowed) * 100}%` }}
          />
          <div className={`absolute inset-0 flex items-center justify-center font-bold ${darkMode ? 'text-white' : 'text-brutal-black'}`}>
            {running} Active
          </div>
        </div>

        {/* Set count controls */}
        <div className="flex gap-2">
          <Input
            type="number"
            min="0"
            max={maxAllowed}
            value={targetCount}
            onChange={(e) => setTargetCount(e.target.value)}
            placeholder={`0-${maxAllowed}`}
            className="flex-1"
          />
          <Button
            onClick={handleSetCount}
            disabled={setCountMutation.isPending || !targetCount}
          >
            SET COUNT
          </Button>
        </div>

        {/* Instance list */}
        {instanceStats.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {instanceStats.map((instance) => (
              <div
                key={instance.id}
                className={`flex justify-between items-center p-2 border text-xs gap-2 ${
                  darkMode ? 'border-brutal-dark-border bg-brutal-dark' : 'border-brutal-black bg-gray-50'
                }`}
              >
                <span className={`font-mono truncate w-20 ${darkMode ? 'text-brutal-gray' : 'text-gray-600'}`}>{instance.id.slice(0, 8)}...</span>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-brutal-black'}`}>{instance.transactionsExecuted} TX</span>
                <span
                  className={`px-2 py-1 font-bold ${
                    instance.status === 'running'
                      ? 'bg-brutal-green text-black'
                      : instance.status === 'error'
                      ? 'bg-brutal-red text-white'
                      : darkMode ? 'bg-brutal-dark-border text-brutal-gray' : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {instance.status.toUpperCase()}
                </span>
                {instance.status === 'running' && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => stopInstanceMutation.mutate(instance.id)}
                    disabled={stopInstanceMutation.isPending}
                  >
                    STOP
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
