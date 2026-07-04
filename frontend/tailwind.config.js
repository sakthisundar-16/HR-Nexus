/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#FFEED6', 50: '#FFFBF5', 100: '#FFF7EB', 200: '#FFEED6', 300: '#FFE0B3', 400: '#FFD090', 500: '#FFC06D' },
        terracotta: { DEFAULT: '#E8A07C', 100: '#F5D4C3', 200: '#EFC1A8', 300: '#E8A07C', 400: '#DF7E50', 500: '#CC6030' },
        sage: { DEFAULT: '#A5AF79', 100: '#D8DDB8', 200: '#C2C99B', 300: '#A5AF79', 400: '#8A965C', 500: '#6F7A44' },
        olive: { DEFAULT: '#827148', 100: '#C8B98D', 200: '#A8925E', 300: '#827148', 400: '#655835', 500: '#4A3F26' },
        nexus: {
          bg: '#FFFBF5',
          'bg-dark': '#1A1410',
          surface: '#FFF7EB',
          'surface-dark': '#251E15',
          card: 'rgba(255,238,214,0.6)',
          'card-dark': 'rgba(37,30,21,0.7)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: { xs: '2px', sm: '4px', md: '8px', lg: '16px', xl: '24px' },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.92)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        glow: { from: { boxShadow: '0 0 10px rgba(232,160,124,0.3)' }, to: { boxShadow: '0 0 25px rgba(232,160,124,0.7)' } },
      },
      boxShadow: {
        glass: '0 8px 32px rgba(130,113,72,0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
        'glass-dark': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        nexus: '0 4px 24px rgba(232,160,124,0.25)',
        'nexus-lg': '0 12px 48px rgba(232,160,124,0.35)',
        node: '0 8px 32px rgba(130,113,72,0.2)',
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem', '4xl': '2rem' },
      gridTemplateColumns: { 'hub': '1fr 300px 1fr' },
    },
  },
  plugins: [],
}
