import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input } from '../ui';
import { useAppStore } from '../../store';
import { instanceApi } from '../../services/api';

export function InstancePanel() {
  const { liveStats, instanceStats } = useAppStore();
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
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-bold">Running:</span>
          <span className="text-2xl font-extrabold">
            {running} / {maxAllowed}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-8 border-4 border-brutal-black bg-gray-200 relative">
          <div
            className="h-full bg-brutal-green transition-all"
            style={{ width: `${(running / maxAllowed) * 100}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center font-bold">
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
                className="flex justify-between items-center p-2 border-2 border-brutal-black text-xs"
              >
                <span className="font-mono truncate w-24">{instance.id.slice(0, 8)}...</span>
                <span className="font-bold">{instance.transactionsExecuted} TX</span>
                <span
                  className={`px-2 py-1 font-bold ${
                    instance.status === 'running'
                      ? 'bg-brutal-green'
                      : instance.status === 'error'
                      ? 'bg-brutal-red text-white'
                      : 'bg-gray-300'
                  }`}
                >
                  {instance.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
