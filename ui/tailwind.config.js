/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        ibmPlexMono: ["var(--font-ibmPlexMono)", "sans-serif"],
        rubikMonoOne: ["--font-rubikMonoOne", "sans-serif"],
      },
      fontSize: {
        lg: ["20px", "28px"],
        xl: ["24px", "32px"],
        h1: ["52px", "64px"],
        h2: ["42px", "54px"],
        h3: ["32px", "44px"],
        h4: ["24px", "32px"],
        h5: ["20px", "28px"],
        h6: ["18px", "24x"],
        body1: ["16px", "24px"],
        body2: ["14px", "22px"],
        caption: ["12px", "16px"],
      },
      colors: {
        primary: {
          300: "#F7931A",
        },
        gray: {
          100: "#EEEEEE",
          400: "#929292",
          500: "#787878",
          600: "#606060",
        },
      },
    },
  },
  daisyui: {
    themes: [
      "light",
      // "dark"
    ],
  },
  plugins: [require("daisyui")],
};
