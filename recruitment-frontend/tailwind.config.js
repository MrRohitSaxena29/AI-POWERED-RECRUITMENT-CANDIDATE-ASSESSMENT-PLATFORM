/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        deepblue: '#0f172a',
        gold: '#f59e0b',
        crimson: '#e11d48'
      }
    },
  },
  plugins: [],
}
