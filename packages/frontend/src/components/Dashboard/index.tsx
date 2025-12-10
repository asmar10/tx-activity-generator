import { useEffect } from 'react';
import { Header } from './Header';
import { InstancePanel } from './InstancePanel';
import { FundingPanel } from './FundingPanel';
import { StatsPanel } from './StatsPanel';
import { WalletGrid } from './WalletGrid';
import { connectSocket } from '../../services/socket';
import { useAppStore } from '../../store';
import { statsApi } from '../../services/api';

export function Dashboard() {
  const darkMode = useAppStore((state) => state.darkMode);
  const setRecentTransactions = useAppStore((state) => state.setRecentTransactions);

  useEffect(() => {
    connectSocket();

    // Load recent transactions on startup
    statsApi.getTransactions(5).then((transactions) => {
      setRecentTransactions(transactions);
    }).catch((err) => {
      console.error('Failed to load recent transactions:', err);
    });
  }, [setRecentTransactions]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-brutal-dark' : 'bg-gray-100'}`}>
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

      <footer className={`py-4 mt-8 border-t-2 ${darkMode ? 'bg-brutal-dark-card border-brutal-dark-border text-brutal-gray' : 'bg-white border-brutal-black text-gray-600'}`}>
        <div className="container mx-auto px-4 text-center text-sm">
          <span className={`font-bold ${darkMode ? 'text-brutal-cyan' : 'text-brutal-black'}`}>TX Activity Generator</span>
          <span className="mx-2">|</span>
          <span>Vanar Chain (ChainID: 2040)</span>
        </div>
      </footer>
    </div>
  );
}
