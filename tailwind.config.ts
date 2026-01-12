import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Heritage Pack Colors (Premium) - Original Six Teams
                'montreal-red': '#AF1E2D',
                'montreal-blue': '#192168',
                'toronto-blue': '#003E7E',
                'toronto-white': '#FFFFFF',
                'boston-gold': '#FFB81C',
                'boston-black': '#000000',
                'detroit-red': '#CE1126',
                'detroit-white': '#FFFFFF',

                // Enforcer Pack Colors (Premium)
                'philly-orange': '#F74902',
                'philly-black': '#000000',

                // Nostalgia Pack Colors (Premium)
                'quebec-blue': '#13294B',
                'quebec-white': '#FFFFFF',
                'quebec-red': '#EF3340',
                'hartford-green': '#00843D',
                'hartford-blue': '#041E42',
                'minnesota-green': '#006341',
                'minnesota-gold': '#FFB81C',

                // Sunbelt Colors (Free)
                'vegas-gold': '#B4975A',
                'florida-teal': '#041E42',
                'arizona-grey': '#8C2633',

                // System Colors
                'ice-white': '#F0F8FF',
                'rink-blue': '#4A90E2',
                'zamboni-grey': '#6B7280',
                'puck-black': '#1F2937',

                // Ice Status Colors
                'status-frozen': '#3B82F6',
                'status-good': '#10B981',
                'status-slush': '#F59E0B',
                'status-melted': '#EF4444',
            },
            fontFamily: {
                'sans': ['var(--font-outfit)', 'sans-serif'],
                'pixel': ['var(--font-press-start-2p)', 'cursive'],
                'nes': ['var(--font-press-start-2p)', 'cursive'], // Keep alias for legacy
            },
            spacing: {
                // 8px grid system for pixel-perfect layouts
                '1': '8px',
                '2': '16px',
                '3': '24px',
                '4': '32px',
                '5': '40px',
                '6': '48px',
                '8': '64px',
                '10': '80px',
                '12': '96px',
                '16': '128px',
            },
            animation: {
                'skate': 'skate 2s linear infinite',
                'zamboni': 'zamboni 3s linear infinite',
                'blink': 'blink 1s step-end infinite',
            },
            keyframes: {
                skate: {
                    '0%, 100%': { transform: 'translateX(0px)' },
                    '50%': { transform: 'translateX(4px)' },
                },
                zamboni: {
                    '0%': { transform: 'translateX(100vw)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
                blink: {
                    '0%, 50%': { opacity: '1' },
                    '51%, 100%': { opacity: '0' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
