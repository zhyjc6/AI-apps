/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 确保这一行正确，它会扫描 src 文件夹下的所有 js,ts,jsx,tsx 文件
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}