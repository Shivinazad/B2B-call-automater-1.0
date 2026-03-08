import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-orange': '#F15A2B',
        'brand-peach': '#FBCEB1',
        'brand-light': '#FDFCF9',
        'brand-surface': '#FFFFFF',
        'brand-border': '#EAEAEA',
        'brand-dark': '#222222',
        
        // Re-mapping dark theme vars just so existing components don't break immediately while we refactor
        'dark-bg': '#FDFCF9',
        'dark-card': '#FFFFFF',
        'dark-border': '#EAEAEA',
        'accent-purple': '#F15A2B', // Making it Sarvam Orange Instead
        'accent-cyan': '#FBCEB1',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
