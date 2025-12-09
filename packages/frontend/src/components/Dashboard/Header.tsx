import React from 'react';
import { StatusIndicator } from '../ui';
import { useAppStore } from '../../store';

export function Header() {
  const { isConnected, liveStats } = useAppStore();

  return (
    <header className="bg-brutal-black text-white border-b-4 border-brutal-black">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-extrabold uppercase tracking-wider">
            TX ACTIVITY GENERATOR
          </h1>
          <span className="bg-brutal-yellow text-brutal-black px-2 py-1 text-xs font-bold">
            VANAR CHAIN
          </span>
        </div>

        <div className="flex items-center gap-6">
          <StatusIndicator
            status={isConnected ? 'connected' : 'disconnected'}
            label={isConnected ? 'LIVE' : 'OFFLINE'}
          />

          {liveStats && (
            <div className="flex items-center gap-2 bg-white text-brutal-black px-3 py-1 border-2 border-white">
              <span className="font-bold text-xs uppercase">Master:</span>
              <span className="font-mono">
                {parseFloat(liveStats.masterWallet.balance).toFixed(2)} VANRY
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
