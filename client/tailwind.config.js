/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a8f7',
          500: '#0e8ce6',
          600: '#026fc4',
          700: '#03589f',
          800: '#074b83',
          900: '#0c3f6d',
          950: '#062847',
        },
        slate: {
          850: '#151f33',
          950: '#0a0f1d',
        },
        midnight: '#0F172A', // Midnight Navy for hero and high contrast
        cobalt: '#2563EB',   // Cobalt Blue for primary actions & active states
        ice: '#EFF6FF',      // Ice Blue for selected filters & panels
        brand: {
          lost: '#0F172A',      // Midnight Navy
          found: '#2563EB',     // Cobalt Blue
          reception: '#0284C7', // Azure Blue
          finder: '#3B82F6',    // Bright Blue
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Electrolize"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -3px rgba(2, 132, 199, 0.4)',
        'glow-blue': '0 0 25px -4px rgba(37, 99, 235, 0.35)',
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.08)',
        'glass-hover': '0 14px 40px -10px rgba(2, 132, 199, 0.18)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
