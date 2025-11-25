/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arcade: {
          black: '#0f0f23',
          dark: '#1a1a2e',
          purple: '#16213e',
          blue: '#0f3460',
          pink: '#ff2a6d',
          cyan: '#05d9e8',
          yellow: '#f9f002',
          green: '#00ff41',
          orange: '#ff6b35',
        }
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        retro: ['VT323', 'monospace'],
      },
      fontSize: {
        // Pixel font sizes (작은 크기 권장)
        'pixel-xs': ['8px', { lineHeight: '1.5' }],
        'pixel-sm': ['10px', { lineHeight: '1.5' }],
        'pixel-base': ['12px', { lineHeight: '1.5' }],
        'pixel-lg': ['14px', { lineHeight: '1.5' }],
        'pixel-xl': ['18px', { lineHeight: '1.5' }],
        // Retro font sizes
        'retro-sm': ['16px', { lineHeight: '1.4' }],
        'retro-base': ['20px', { lineHeight: '1.4' }],
        'retro-lg': ['24px', { lineHeight: '1.4' }],
        'retro-xl': ['32px', { lineHeight: '1.4' }],
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(5, 217, 232, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 42, 109, 0.5)',
        'neon-green': '0 0 20px rgba(0, 255, 65, 0.5)',
        'neon-yellow': '0 0 20px rgba(249, 240, 2, 0.5)',
        'arcade-card': '0 0 20px rgba(5, 217, 232, 0.3), inset 0 0 60px rgba(5, 217, 232, 0.1)',
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-badge': 'pulse-badge 0.5s ease-in-out infinite alternate',
        'rainbow': 'rainbow 3s linear infinite',
        'flicker': 'flicker 5s infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-badge': {
          from: { transform: 'scale(1)' },
          to: { transform: 'scale(1.1)' },
        },
        rainbow: {
          '0%': { backgroundColor: '#ff2a6d' },
          '25%': { backgroundColor: '#05d9e8' },
          '50%': { backgroundColor: '#00ff41' },
          '75%': { backgroundColor: '#ff6b35' },
          '100%': { backgroundColor: '#ff2a6d' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.8' },
          '94%': { opacity: '1' },
          '97%': { opacity: '0.9' },
        },
      },
    },
  },
  plugins: [],
}
