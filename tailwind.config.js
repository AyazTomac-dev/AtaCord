/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        discord: {
          50: '#e0e0e0',
          100: '#c2c2c2',
          200: '#a3a3a3',
          300: '#858585',
          400: '#666666',
          500: '#4d4d4d',
          600: '#333333',
          700: '#292929',
          800: '#1f1f1f',
          900: '#141414',
        },
        primary: {
          500: '#5865F2',
          600: '#4752C4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}