/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chatgpt: {
          sidebar: {
            light: '#f9f9f9',
            dark: '#171717',
          },
          main: {
            light: '#ffffff',
            dark: '#212121',
          },
          bubble: {
            userLight: '#f4f4f4',
            userDark: '#303030',
            aiLight: 'transparent',
            aiDark: 'transparent',
          },
          hover: {
            light: '#ececec',
            dark: '#2f2f2f',
          },
          border: {
            light: '#e5e5e5',
            dark: '#303030',
          },
          input: {
            light: '#f4f4f4',
            dark: '#2f2f2f',
          }
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
