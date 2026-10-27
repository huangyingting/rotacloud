import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rc: {
          blue: '#0a65fc',
          blueDark: '#074fc7',
          blueLight: '#ebf3ff',
          navy: '#0a0e2f',
          cream: '#fbf6ee',
          sand: '#f2ede2',
          body: '#555459',
          surface: '#f5f6f8',
          border: '#e2e5ec',
          green: '#1ec076',
          amber: '#f5b827',
          red: '#e52332',
        },
      },
      fontFamily: {
        marketing: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        app: ['"Source Sans Pro"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
