import React, { useEffect } from 'react';
import { Header } from './Header';
import { InstancePanel } from './InstancePanel';
import { FundingPanel } from './FundingPanel';
import { StatsPanel } from './StatsPanel';
import { WalletGrid } from './WalletGrid';
import { connectSocket } from '../../services/socket';

export function Dashboard() {
  useEffect(() => {
    connectSocket();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <InstancePanel />
            <FundingPanel />
          </div>

          {/* Center column */}
          <div className="lg:col-span-2 space-y-6">
            <StatsPanel />
            <WalletGrid />
          </div>
        </div>
      </main>

      <footer className="bg-brutal-black text-white py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm">
          <span className="font-bold">TX Activity Generator</span>
          <span className="mx-2">|</span>
          <span>Vanar Chain (ChainID: 2040)</span>
        </div>
      </footer>
    </div>
  );
}
