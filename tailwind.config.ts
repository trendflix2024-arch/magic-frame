import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
            },
            animation: {
                aurora: "aurora 60s linear infinite",
            },
            keyframes: {
                aurora: {
                    from: { backgroundPosition: "50% 50%, 50% 50%" },
                    to:   { backgroundPosition: "350% 50%, 350% 50%" },
                },
            },
        },
    },
    plugins: [],
};
export default config;
