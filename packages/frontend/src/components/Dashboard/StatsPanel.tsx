import React from 'react';
import { Card } from '../ui';
import { useAppStore } from '../../store';

export function StatsPanel() {
  const { liveStats, recentTransactions } = useAppStore();

  const txStats = liveStats?.transactions;
  const todayStats = liveStats?.today;

  return (
    <Card title="STATISTICS">
      <div className="space-y-4">
        {/* Main stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border-4 border-brutal-black p-3 text-center">
            <div className="text-2xl font-extrabold">{txStats?.total || 0}</div>
            <div className="text-xs font-bold uppercase">Total TX</div>
          </div>
          <div className="border-4 border-brutal-black p-3 text-center bg-brutal-green">
            <div className="text-2xl font-extrabold">
              {(txStats?.successRate || 0).toFixed(1)}%
            </div>
            <div className="text-xs font-bold uppercase">Success Rate</div>
          </div>
          <div className="border-4 border-brutal-black p-3 text-center">
            <div className="text-2xl font-extrabold">{todayStats?.totalTx || 0}</div>
            <div className="text-xs font-bold uppercase">Today TX</div>
          </div>
          <div className="border-4 border-brutal-black p-3 text-center bg-brutal-red text-white">
            <div className="text-2xl font-extrabold">{txStats?.failed || 0}</div>
            <div className="text-xs font-bold uppercase">Failed</div>
          </div>
        </div>

        <div className="border-4 border-brutal-black p-3 text-center bg-brutal-cyan">
          <div className="text-xl font-extrabold">
            {parseFloat(todayStats?.volume || '0').toFixed(2)} VANRY
          </div>
          <div className="text-xs font-bold uppercase">Today Volume</div>
        </div>

        <div className="brutal-divider" />

        {/* Transaction Feed */}
        <div>
          <div className="font-bold uppercase mb-2">Live Transaction Feed</div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {recentTransactions.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No transactions yet</div>
            ) : (
              recentTransactions.slice(0, 10).map((tx, i) => (
                <div
                  key={tx.txHash || i}
                  className="flex items-center gap-2 text-xs font-mono p-2 border-2 border-brutal-black"
                >
                  <span
                    className={`w-2 h-2 ${
                      tx.status === 'success'
                        ? 'bg-brutal-green'
                        : tx.status === 'failed'
                        ? 'bg-brutal-red'
                        : 'bg-brutal-yellow'
                    }`}
                  />
                  <span className="truncate w-16">{tx.from.slice(0, 6)}...</span>
                  <span>→</span>
                  <span className="truncate w-16">{tx.to.slice(0, 6)}...</span>
                  <span className="flex-1 text-right font-bold">
                    {parseFloat(tx.amount).toFixed(4)}
                  </span>
                  <span
                    className={`font-bold ${
                      tx.status === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {tx.status === 'success' ? '✓' : tx.status === 'failed' ? '✗' : '⋯'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
