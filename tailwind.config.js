/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0b0b0d', surface: '#16161a', steel: '#2a2a30' },
        blood: { DEFAULT: '#b3121b', hover: '#e0242e' },
        ember: '#ff6a1a',
        gold: '#e8b33a',
        bone: { DEFAULT: '#eee6d8', muted: '#9a948a' },
        moon: '#7fa6c9',
      },
      fontFamily: {
        horror: ['Nosifer', 'cursive'],
        heading: ['"Black Ops One"', 'system-ui', 'sans-serif'],
        body: ['Oswald', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'fog-drift': 'fogDrift 20s linear infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'glitch': 'glitch 4s linear infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        fogDrift: {
          '0%': { transform: 'translateX(-5%) scale(1.1)' },
          '50%': { transform: 'translateX(5%) scale(1.15)' },
          '100%': { transform: 'translateX(-5%) scale(1.1)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '2%': { transform: 'translate(-2px, 1px)' },
          '4%': { transform: 'translate(2px, -1px)' },
          '6%': { transform: 'translate(0)' },
          '50%': { transform: 'translate(0)' },
          '52%': { transform: 'translate(1px, 2px)' },
          '54%': { transform: 'translate(-1px, -1px)' },
          '56%': { transform: 'translate(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
