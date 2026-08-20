/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0A0D',
          900: '#131117',
          850: '#181620',
          800: '#1E1B26',
          700: '#2A2632',
          600: '#3B3645',
          500: '#565064',
        },
        bone: {
          100: '#F5F1EA',
          200: '#E7E1D6',
          300: '#C9C2B4',
          400: '#9B9488',
        },
        brass: {
          400: '#E4BA6D',
          500: '#D4A24E',
          600: '#B0813A',
        },
        teal: {
          400: '#5FC3B0',
          500: '#3FA796',
          600: '#2E7E71',
        },
        clay: {
          400: '#D97A5C',
          500: '#C4633F',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(245,241,234,0.06) inset',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
