import { useAppStore } from '../../store';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  const darkMode = useAppStore((state) => state.darkMode);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className={`font-bold uppercase text-sm tracking-wide ${
          darkMode ? 'text-brutal-gray' : 'text-gray-700'
        }`}>{label}</label>
      )}
      <input
        className={`border-2 px-3 py-2 font-mono focus:outline-none focus:ring-2 ${
          darkMode
            ? 'bg-brutal-dark border-brutal-dark-border text-white placeholder-brutal-gray focus:ring-brutal-cyan'
            : 'bg-white border-brutal-black text-brutal-black placeholder-gray-400 focus:ring-brutal-yellow'
        } ${className}`}
        {...props}
      />
    </div>
  );
}
