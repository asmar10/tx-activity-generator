import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusIndicator } from '../ui';
import { useAppStore } from '../../store';
import { simulatorApi } from '../../services/api';

export function Header() {
  const { isConnected, liveStats, simulatorMode, setSimulatorMode, darkMode, toggleDarkMode } = useAppStore();
  const queryClient = useQueryClient();

  const toggleModeMutation = useMutation({
    mutationFn: async () => {
      if (simulatorMode) {
        await simulatorApi.disable();
      } else {
        await simulatorApi.enable();
      }
    },
    onSuccess: () => {
      setSimulatorMode(!simulatorMode);
      queryClient.invalidateQueries();
    },
  });

  return (
    <header className={`border-b-2 ${darkMode ? 'bg-brutal-dark-card border-brutal-dark-border' : 'bg-white border-brutal-black'}`}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className={`text-2xl font-extrabold uppercase tracking-wider ${darkMode ? 'text-brutal-cyan' : 'text-brutal-black'}`}>
            TX ACTIVITY GENERATOR
          </h1>
          <span className="bg-brutal-yellow text-brutal-black px-2 py-1 text-xs font-bold">
            VANAR CHAIN
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded border-2 transition-colors ${
              darkMode
                ? 'bg-brutal-dark border-brutal-dark-border text-brutal-yellow hover:bg-brutal-dark-card'
                : 'bg-gray-100 border-brutal-black text-brutal-black hover:bg-gray-200'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* Simulator Mode Toggle */}
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-2 py-1 ${
                simulatorMode
                  ? 'bg-brutal-yellow text-brutal-black'
                  : 'bg-brutal-green text-brutal-black'
              }`}
            >
              {simulatorMode ? 'SIMULATOR' : 'MAINNET'}
            </span>
            <button
              onClick={() => toggleModeMutation.mutate()}
              disabled={toggleModeMutation.isPending}
              className={`relative w-14 h-7 rounded-full transition-colors border-2 ${
                darkMode ? 'border-brutal-dark-border' : 'border-brutal-black'
              } ${simulatorMode ? 'bg-brutal-yellow' : 'bg-brutal-green'} ${
                toggleModeMutation.isPending ? 'opacity-50' : ''
              }`}
              title={simulatorMode ? 'Switch to Mainnet' : 'Switch to Simulator'}
            >
              <span
                className={`absolute w-5 h-5 rounded-full top-0.5 transition-transform ${
                  darkMode ? 'bg-brutal-dark' : 'bg-white'
                } ${simulatorMode ? 'translate-x-7' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          <StatusIndicator
            status={isConnected ? 'connected' : 'disconnected'}
            label={isConnected ? 'LIVE' : 'OFFLINE'}
          />

          {liveStats && !simulatorMode && (
            <div className={`flex items-center gap-2 px-3 py-1 border-2 ${
              darkMode
                ? 'bg-brutal-dark border-brutal-dark-border'
                : 'bg-gray-100 border-brutal-black'
            }`}>
              <span className={`font-bold text-xs uppercase ${darkMode ? 'text-brutal-gray' : 'text-gray-600'}`}>Master:</span>
              <span className={`font-mono ${darkMode ? 'text-brutal-cyan' : 'text-brutal-black font-bold'}`}>
                {parseFloat(liveStats.masterWallet?.balance || '0').toFixed(2)} VANRY
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
