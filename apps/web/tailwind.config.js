/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilita o dark mode via classe
  theme: {
    extend: {
      colors: {
        club: {
          blue: '#125397',       // Extraído do logo_01
          lightpink: '#fdeae6',  // Extraído do logo_02
          beige: '#f7f5e9',      // Extraído do logo_03
          pink: '#ec4899',       // Um rosa mais vibrante para contraste no tema claro
          darkbg: '#0f172a'      // Fundo para o tema escuro
        },
      }
    },
  },
  plugins: [],
}
