/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: '#0f1117',
          DEFAULT: '#4f8ef7',
          hover: '#3a7be0',
          light: '#6ba3ff',
        },
        surface: {
          DEFAULT: '#1a1d27',
          light: '#242835',
          border: '#2a2e3a',
        },
        accent: {
          DEFAULT: '#4f8ef7',
          green: '#34d399',
          amber: '#fbbf24',
          red: '#f87171',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#64748b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
