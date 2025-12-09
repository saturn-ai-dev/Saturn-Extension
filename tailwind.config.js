/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      colors: {
        zen: {
          bg: 'var(--bg-color)',
          surface: 'var(--surface-color)',
          border: 'var(--border-color)',
          accent: 'var(--accent-color)',
          accentHover: 'var(--accent-hover)',
          text: 'var(--text-color)',
          muted: 'var(--muted-color)',
        }
      },
      boxShadow: {
        'glow': '0 0 20px -5px var(--accent-color)',
        'glow-lg': '0 0 40px -10px var(--accent-color)',
        'deep': '0 10px 40px -10px rgba(0,0,0,0.8)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
        'spin-slow': 'spin 12s linear infinite',
        'blob': 'blob 20s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px var(--accent-color)' },
          '100%': { boxShadow: '0 0 25px var(--accent-color)' },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(50px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-30px, 30px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
