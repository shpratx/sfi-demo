import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "hive-yellow": "#F5C518",
        "hive-yellow-dark": "#D4A900",
        "bg-app": "#1A1A1A",
        "bg-nav": "#111111",
        "bg-page": "#E8E8E8",
        "bg-surface": "#FFFFFF",
        "text-primary": "#1A1A1A",
        "text-secondary": "#555555",
        "border-light": "#E0E0E0",
        "border-input": "#CCCCCC",
        "status-error": "#D32F2F",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
      },
    },
  },
  plugins: [],
} satisfies Config;
