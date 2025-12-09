import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="font-bold uppercase text-sm tracking-wide">{label}</label>
      )}
      <input
        className={`border-4 border-brutal-black px-3 py-2 font-mono focus:outline-none focus:ring-4 focus:ring-brutal-yellow ${className}`}
        {...props}
      />
    </div>
  );
}
