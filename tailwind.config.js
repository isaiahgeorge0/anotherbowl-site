/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        /* Warm terracotta / clay — main interactive accent */
        primary: '#A37B66',
        /* Cream page wash (pairs with --brand-cream) */
        light: '#F4EFE8',
        /* Muted warm brass (highlights) */
        accent: '#B8956A',
        /* Soft mint-sage wash */
        mint: '#D4DFD0',
        /* Boutique mauve for rare “berry” callouts */
        berry: '#6B4E5D',
        brandPink: 'rgb(var(--brand-pink) / <alpha-value>)',
        brandGreen: 'rgb(var(--brand-green) / <alpha-value>)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
};
