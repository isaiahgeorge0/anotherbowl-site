/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF3E86',
        light: '#FEE1E1',
        accent: '#FFD700',
        mint: '#C8F6BA',
        berry: '#9400D3',
      },
    },
  },
  plugins: [],
}
