/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        s24: "411px", // 갤럭시 S24+ 및 대화면 기기 기준
        tablet: "768px",
      },
      colors: {
        midnight: {
          background: "#001220",
          point: "#00E0D0",
          card: "#002845",
          text: "#E0E0E0",
          accent: "#E7433C",
        },
      },
    },
  },
  plugins: [],
};
