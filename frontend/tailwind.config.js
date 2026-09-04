/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ner-dark': '#0a0f1c',
        'ner-primary': '#00d4ff',
        'ner-secondary': '#14b8a6',
      },
    },
  },
  plugins: [],
}
