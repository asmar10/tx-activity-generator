import { Card } from '../ui';
import { useAppStore } from '../../store';
import { formatWeiToEth } from '../../utils/format';

export function StatsPanel() {
  const { liveStats, recentTransactions, darkMode } = useAppStore();

  const txStats = liveStats?.transactions;
  const todayStats = liveStats?.today;

  return (
    <Card title="STATISTICS">
      <div className="space-y-4">
        {/* Main stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`border-2 p-3 text-center ${darkMode ? 'border-brutal-dark-border bg-brutal-dark' : 'border-brutal-black bg-gray-100'}`}>
            <div className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-brutal-black'}`}>{txStats?.total || 0}</div>
            <div className={`text-xs font-bold uppercase ${darkMode ? 'text-brutal-gray' : 'text-gray-600'}`}>Total TX</div>
          </div>
          <div className={`border-2 p-3 text-center bg-brutal-green ${darkMode ? 'border-brutal-dark-border' : 'border-brutal-black'}`}>
            <div className="text-2xl font-extrabold text-black">
              {(txStats?.successRate || 0).toFixed(1)}%
            </div>
            <div className="text-xs font-bold uppercase text-black">Success Rate</div>
          </div>
          <div className={`border-2 p-3 text-center ${darkMode ? 'border-brutal-dark-border bg-brutal-dark' : 'border-brutal-black bg-gray-100'}`}>
            <div className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-brutal-black'}`}>{todayStats?.totalTx || 0}</div>
            <div className={`text-xs font-bold uppercase ${darkMode ? 'text-brutal-gray' : 'text-gray-600'}`}>Today TX</div>
          </div>
          <div className={`border-2 p-3 text-center bg-brutal-red ${darkMode ? 'border-brutal-dark-border' : 'border-brutal-black'}`}>
            <div className="text-2xl font-extrabold text-white">{txStats?.failed || 0}</div>
            <div className="text-xs font-bold uppercase text-white">Failed</div>
          </div>
        </div>

        <div className={`border-2 p-3 text-center bg-brutal-cyan ${darkMode ? 'border-brutal-dark-border' : 'border-brutal-black'}`}>
          <div className="text-xl font-extrabold text-black">
            {parseFloat(todayStats?.volume || '0').toFixed(2)} VANRY
          </div>
          <div className="text-xs font-bold uppercase text-black">Today Volume</div>
        </div>

        <div className={`border-t-2 my-4 ${darkMode ? 'border-brutal-dark-border' : 'border-brutal-black'}`} />

        {/* Transaction Feed */}
        <div>
          <div className={`font-bold uppercase mb-2 ${darkMode ? 'text-brutal-gray' : 'text-gray-700'}`}>Live Transaction Feed</div>
          <div className="space-y-1">
            {recentTransactions.length === 0 ? (
              <div className={`text-center py-4 ${darkMode ? 'text-brutal-gray' : 'text-gray-500'}`}>No transactions yet</div>
            ) : (
              recentTransactions.slice(0, 5).map((tx, i) => (
                <div
                  key={tx.txHash || i}
                  className={`flex items-center gap-2 text-xs font-mono p-2 border ${
                    darkMode ? 'border-brutal-dark-border bg-brutal-dark' : 'border-brutal-black bg-gray-50'
                  }`}
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
                  <span className={`truncate w-16 ${darkMode ? 'text-brutal-gray' : 'text-gray-600'}`}>{tx.from.slice(0, 6)}...</span>
                  <span className={darkMode ? 'text-brutal-cyan' : 'text-brutal-black'}>→</span>
                  <span className={`truncate w-16 ${darkMode ? 'text-brutal-gray' : 'text-gray-600'}`}>{tx.to.slice(0, 6)}...</span>
                  <span className={`flex-1 text-right font-bold ${darkMode ? 'text-white' : 'text-brutal-black'}`}>
                    {formatWeiToEth(tx.amount)} VANRY
                  </span>
                  <span
                    className={`font-bold ${
                      tx.status === 'success' ? 'text-brutal-green' : 'text-brutal-red'
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
