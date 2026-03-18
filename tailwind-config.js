/**
 * Single source of truth for Ballpark design tokens.
 * Load this after the Tailwind CDN script on every HTML page.
 */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        // Primary
        'bp-blue': '#1141FF',
        // Secondary (Fly balls)
        'bp-glove': '#DEB5A4',
        'bp-grass': '#CEDC9E',
        'bp-gum': '#EAC9ED',
        'bp-mustard': '#F5E5A3',
        'bp-mound': '#F3EFE3',
        'bp-sky': '#D4E4FF',
        // Neutrals
        'bp-eyeblack': '#141414',
        'bp-chalk': '#F9F9F9',
      },
      fontFamily: {
        brand: ['"ABC Oracle"', 'system-ui', 'sans-serif'],
        billboard: ['"BPDots Regular"', 'system-ui', 'sans-serif'],
        eyebrow: ['"BPDots Bold"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightish: '-0.03em',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 15s linear infinite',
      },
      borderRadius: {
        none: '0px',
        default: '3px',
        DEFAULT: '3px',
        sm: '3px',
        md: '3px',
        lg: '3px',
        xl: '3px',
        '2xl': '3px',
        '3xl': '3px',
        full: '999px',
      },
    },
  },
};
