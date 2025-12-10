/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brutal-black': '#000000',
        'brutal-white': '#FFFFFF',
        'brutal-yellow': '#FFE500',
        'brutal-cyan': '#00FFFF',
        'brutal-magenta': '#FF00FF',
        'brutal-red': '#FF3333',
        'brutal-green': '#00FF00',
        'brutal-dark': '#0a0a0a',
        'brutal-dark-card': '#1a1a1a',
        'brutal-dark-border': '#333333',
        'brutal-gray': '#888888',
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-lg': '8px 8px 0px 0px #000000',
        'brutal-hover': '6px 6px 0px 0px #333333',
        'brutal-glow': '0 0 20px rgba(0, 255, 0, 0.3)',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
