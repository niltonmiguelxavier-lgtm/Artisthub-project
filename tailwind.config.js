/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0E14',
          900: '#10151D',
          850: '#151B25',
          800: '#1B222E',
          700: '#28303F',
          600: '#3A4456',
          500: '#4E5A70',
        },
        bone: {
          100: '#F1F3F6',
          200: '#DCE1E8',
          300: '#B4BCC8',
          400: '#7C8698',
        },
        cobalt: {
          400: '#5B9BF0',
          500: '#3B7DD8',
          600: '#2C5FAE',
        },
        teal: {
          400: '#4DC3B0',
          500: '#33A896',
          600: '#26806F',
        },
        amber: {
          400: '#E0A93E',
        },
        rose: {
          400: '#E0637A',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(241,243,246,0.06) inset',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
