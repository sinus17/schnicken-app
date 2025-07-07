/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        schnicken: {
          darkest: '#092635',   // dark navy blue
          dark: '#1B4242',      // dark teal
          medium: '#5C8374',    // muted green
          light: '#9EC8B9',     // light sage green
        },
      },
    },
  },
  plugins: [],
}
