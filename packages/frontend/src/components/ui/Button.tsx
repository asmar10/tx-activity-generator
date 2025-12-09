import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'success' | 'cyan' | 'magenta';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClass = 'border-4 border-brutal-black font-bold uppercase transition-all';

  const variantClasses = {
    primary: 'bg-brutal-yellow text-brutal-black',
    danger: 'bg-brutal-red text-white',
    success: 'bg-brutal-green text-brutal-black',
    cyan: 'bg-brutal-cyan text-brutal-black',
    magenta: 'bg-brutal-magenta text-white',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs shadow-[2px_2px_0px_0px_#000]',
    md: 'px-4 py-2 text-sm shadow-brutal',
    lg: 'px-6 py-3 text-base shadow-brutal-lg',
  };

  const enabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'hover:shadow-brutal-hover hover:-translate-y-1 hover:-translate-x-1 active:shadow-none active:translate-y-1 active:translate-x-1';

  return (
    <button
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${enabledClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
