import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export function Card({ title, children, className = '', headerRight }: CardProps) {
  return (
    <div className={`bg-white border-4 border-brutal-black shadow-brutal ${className}`}>
      {title && (
        <div className="border-b-4 border-brutal-black px-4 py-3 flex justify-between items-center bg-brutal-black text-white">
          <h2 className="font-extrabold uppercase tracking-wider">{title}</h2>
          {headerRight}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
