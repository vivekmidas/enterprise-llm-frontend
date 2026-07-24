export const theme = {
  colors: {
    primary: '#B2EDC5',
    secondary: '#25272c',
    text: {
      primary: '#09090b', // black-900
      secondary: '#B2EDC5', // gray-900
    },
    background: '#ffffff',
    card: '#f8fafc',
    border: '#e2e8f0',
  },
} as const;

export type Theme = typeof theme;
