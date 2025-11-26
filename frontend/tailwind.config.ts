import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
    	extend: {
    		fontFamily: {
    			sans: [
    				'var(--font-inter)'
    			]
    		},
    		backgroundImage: {
    			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
    			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		colors: {
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
    			lamaSky: '#C3EBFA',
    			lamaSkyLight: '#EDF9FD',
    			lamaPurple: '#CFCEFF',
    			lamaPurpleLight: '#F1F0FF',
    			lamaYellow: '#FAE27C',
    			lamaYellowLight: '#FEFCE8',
    			delSky: '#C3EBFA',
    			delSkyLight: '#EDF9FD',
    			delPurple: '#CFCEFF',
    			delPurpleLight: '#F1F0FF',
    			delYellow: '#FAE27C',
    			delYellowLight: '#FEFCE8',
    			delRose: '#f43f5e',
    			delSkyDark: '#9BD4F5',
    			delPurpleDark: '#312e81',
    			delRoseDark: '#fb7185',
    			delEmerald: '#D1FAE5',
    			delEmeraldDark: '#065F46',
    			delAmber: '#FEF3C7',
				delAmberDark: '#92400E',
				delBack: '#F0F3FA',
    			delRed: {
    				'50': '#FFF0F3',
    				'100': '#FFE4E8',
    				'200': '#FECDD6',
    				'300': '#FDA4AF',
    				'400': '#FB7185',
    				'500': '#F43F5E',
    				'600': '#E11D48',
    				'700': '#BE123C',
    				'800': '#9F1239',
    				'900': '#881337'
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			}
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
};
export default config;
