import React from 'react';

interface StatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'pending';
  label?: string;
}

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const colors = {
    connected: 'bg-brutal-green',
    disconnected: 'bg-brutal-red',
    pending: 'bg-brutal-yellow',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-4 h-4 border-2 border-brutal-black ${colors[status]} ${
          status === 'pending' ? 'animate-pulse' : ''
        }`}
      />
      {label && <span className="font-bold text-sm uppercase">{label}</span>}
    </div>
  );
}
