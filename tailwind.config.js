/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx,css}",
  ],
  theme: {
    etheme: {
      extend: {
        colors: {
          background: "rgb(var(--background) / <alpha-value>)",
          foreground: "rgb(var(--foreground) / <alpha-value>)",
          primary: "rgb(var(--primary) / <alpha-value>)",
          muted: "rgb(var(--muted) / <alpha-value>)",
          border: "rgb(var(--border) / <alpha-value>)",
          ring: "rgb(var(--ring) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
