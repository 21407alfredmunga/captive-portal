module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./server/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        mpesa: {
          green: '#4CAF50',
          darkgreen: '#388E3C',
          lightgreen: '#C8E6C9'
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}