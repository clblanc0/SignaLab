/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: '#101827',
          inkSoft: '#1D293D',
          teal: '#14D8C8',
          tealDark: '#0A9F96',
          violet: '#7C3AED',
          violetDark: '#5B21B6',
          gray: '#8A94A6',
          surface: '#F6F7F9',
          black: '#05070A',
        },
      },
      boxShadow: {
        glowTeal: '0 0 0 1px rgba(20, 216, 200, 0.24), 0 16px 40px rgba(20, 216, 200, 0.14)',
        glowViolet: '0 0 0 1px rgba(124, 58, 237, 0.20), 0 16px 40px rgba(124, 58, 237, 0.12)',
      },
    },
  },
  plugins: [],
}
