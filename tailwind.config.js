/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Enforcing "Cockpit" Theme Palette
                slate: {
                    950: '#0b1120', // Deep Navy Background (Override default slate-950)
                    900: '#1e293b', // Card Background (Slate 800)
                    800: '#334155', // Card Borders (Slate 700)
                    700: '#475569', // Muted Borders
                    400: '#94a3b8', // Muted Text
                    50: '#f8fafc',  // Primary Text
                },
                indigo: {
                    500: '#6366f1', // Primary Action
                    900: '#312e81', // Deep Interaction
                }
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
