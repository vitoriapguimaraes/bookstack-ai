/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          purple: '#d8b4fe', // Light lavender
          green: '#86efac',  // Soft mint
          pink: '#fca5a5',   // Pale coral
          blue: '#93c5fd',   // Baby blue
          yellow: '#fde047', // Mellow yellow
          orange: '#fdba74', // Soft peach
          red: '#f87171',    // Soft red
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-out': 'fadeOut 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
