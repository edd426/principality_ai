/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Card type colors
        'card-treasure': '#fcd34d',
        'card-victory': '#86efac',
        'card-action': '#f9fafb',
        'card-attack': '#fca5a5',
        'card-reaction': '#93c5fd',
        'card-curse': '#a78bfa',
      },
    },
  },
  plugins: [],
};
