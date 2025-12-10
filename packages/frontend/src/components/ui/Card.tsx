import { useAppStore } from '../../store';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export function Card({ title, children, className = '', headerRight }: CardProps) {
  const darkMode = useAppStore((state) => state.darkMode);

  return (
    <div className={`border-2 shadow-brutal ${className} ${
      darkMode
        ? 'bg-brutal-dark-card border-brutal-dark-border'
        : 'bg-white border-brutal-black'
    }`}>
      {title && (
        <div className={`border-b-2 px-4 py-3 flex justify-between items-center ${
          darkMode
            ? 'border-brutal-dark-border bg-brutal-dark'
            : 'border-brutal-black bg-brutal-black'
        }`}>
          <h2 className={`font-extrabold uppercase tracking-wider ${
            darkMode ? 'text-brutal-cyan' : 'text-white'
          }`}>{title}</h2>
          {headerRight}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
