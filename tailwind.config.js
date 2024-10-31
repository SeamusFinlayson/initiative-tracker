/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        secondary: {
          DEFAULT: "#df3fff",
          dark: "#ef9fff"
        }
      }
    },
  },
  plugins: [],
}

