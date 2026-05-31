/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#475569',
        secondary: '#94A3B8',
        surface: '#F9F8F6',
        panel: '#FFFFFF',
        border: '#E5E7EB',
        'text-main': '#1F2937',
        'text-muted': '#6B7280',
      },
      textColor: {
        'text-main': '#1F2937',
        'text-muted': '#6B7280',
      },
      borderColor: {
        border: '#E5E7EB',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(45, 91, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(45, 91, 255, 0.6), 0 0 30px rgba(0, 240, 255, 0.4)' },
        }
      }
    },
  },
  plugins: [],
};
