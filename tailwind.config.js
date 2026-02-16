/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#eef2ff",
                    100: "#e0e7ff",
                    200: "#c7d2fe",
                    300: "#a5b4fc",
                    400: "#818cf8",
                    500: "#6366f1",
                    600: "#4f46e5",
                    700: "#4338ca",
                    800: "#3730a3",
                    900: "#312e81",
                },
                success: {
                    50: "#ecfdf5",
                    100: "#d1fae5",
                    500: "#10b981",
                    600: "#059669",
                    700: "#047857",
                },
                warning: {
                    50: "#fffbeb",
                    500: "#f59e0b",
                    600: "#d97706",
                },
                danger: {
                    50: "#fef2f2",
                    500: "#ef4444",
                    600: "#dc2626",
                },
            },
            fontFamily: {
                tajawal: ["Tajawal", "sans-serif"],
                inter: ["Inter", "sans-serif"],
            },
            borderRadius: {
                "2xl": "1rem",
                "3xl": "1.5rem",
            },
            boxShadow: {
                soft: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
                card: "0 10px 40px -10px rgba(0, 0, 0, 0.08)",
                glass: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                glow: "0 0 40px -10px rgba(99, 102, 241, 0.3)",
            },
            animation: {
                shimmer: "shimmer 2s linear infinite",
                float: "float 6s ease-in-out infinite",
                "fade-in": "fadeIn 0.5s ease-out",
                "slide-up": "slideUp 0.5s ease-out",
            },
            keyframes: {
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
};
