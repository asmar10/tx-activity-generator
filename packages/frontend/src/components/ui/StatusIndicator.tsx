import { useAppStore } from '../../store';

interface StatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'pending';
  label?: string;
}

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const darkMode = useAppStore((state) => state.darkMode);

  const colors = {
    connected: 'bg-brutal-green',
    disconnected: 'bg-brutal-red',
    pending: 'bg-brutal-yellow',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-4 h-4 border ${colors[status]} ${
          darkMode ? 'border-brutal-dark-border' : 'border-brutal-black'
        } ${status === 'pending' ? 'animate-pulse' : ''} ${
          status === 'connected' ? 'animate-glow' : ''
        }`}
      />
      {label && (
        <span className={`font-bold text-sm uppercase ${
          status === 'connected' ? 'text-brutal-green' : 'text-brutal-red'
        }`}>
          {label}
        </span>
      )}
    </div>
  );
}
