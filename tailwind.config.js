/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        abyss: {
          950: '#030712',
          900: '#050a18',
          850: '#081126',
          800: '#0b1937',
        },
        forge: {
          cyan: '#00f2fe',
          violet: '#7928ca',
          electric: '#4facfe',
          neon: '#00ffc2',
          amber: '#ffaa00',
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'abyssal': '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px -5px rgba(0, 242, 254, 0.12)',
        'underglow-cyan': '0 20px 50px -10px rgba(0, 242, 254, 0.25), 0 0 20px rgba(0, 242, 254, 0.15)',
        'underglow-purple': '0 20px 50px -10px rgba(121, 40, 202, 0.35), 0 0 25px rgba(121, 40, 202, 0.2)',
        'underglow-amber': '0 20px 50px -10px rgba(255, 170, 0, 0.3), 0 0 20px rgba(255, 170, 0, 0.15)',
        'portal': '0 0 80px rgba(0, 242, 254, 0.4), inset 0 0 40px rgba(121, 40, 202, 0.4)',
      },
      animation: {
        'float-slow': 'floating 8s ease-in-out infinite',
        'float-medium': 'floating 6s ease-in-out infinite',
        'float-fast': 'floating 4s ease-in-out infinite',
        'pulse-subtle': 'subtlePulse 3s ease-in-out infinite',
        'spin-slow': 'spin 30s linear infinite',
      },
      keyframes: {
        floating: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(0.4deg)' },
        },
        subtlePulse: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}

