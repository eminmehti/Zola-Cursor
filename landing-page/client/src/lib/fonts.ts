import { createGlobalStyle } from 'styled-components';

// Luxury typography system

export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  '6xl': '3.75rem',  // 60px
  '7xl': '4.5rem',   // 72px
  '8xl': '6rem',     // 96px
};

export const letterSpacings = {
  tightest: '-0.075em',
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
  // Special case for luxury
  luxury: '0.15em'
};

export const lineHeights = {
  none: '1',
  tight: '1.1',
  snug: '1.25',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
};

// Typography for specific use cases
export const typography = {
  heading: {
    fontFamily: 'var(--font-heading)',
    fontWeight: fontWeights.semibold,
    letterSpacing: '-0.02em',
    lineHeight: lineHeights.tight,
  },
  
  subheading: {
    fontFamily: 'var(--font-heading)',
    fontWeight: fontWeights.medium,
    letterSpacing: '-0.01em',
    lineHeight: lineHeights.snug,
  },
  
  body: {
    fontFamily: 'var(--font-primary)',
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacings.normal,
    lineHeight: lineHeights.relaxed,
  },
  
  label: {
    fontFamily: 'var(--font-primary)',
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.wide,
    lineHeight: lineHeights.normal,
    textTransform: 'uppercase' as const,
  },
  
  luxuryLabel: {
    fontFamily: 'var(--font-primary)',
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.luxury,
    lineHeight: lineHeights.normal,
    textTransform: 'uppercase' as const,
  },
  
  button: {
    fontFamily: 'var(--font-primary)',
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.wide,
    lineHeight: lineHeights.none,
  },
  
  caption: {
    fontFamily: 'var(--font-primary)',
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacings.normal,
    lineHeight: lineHeights.normal,
    fontSize: fontSizes.sm,
  },
};

// Typography CSS utility classes
export const typographyClasses = {
  // Headings
  h1: `
    font-family: var(--font-heading);
    font-weight: ${fontWeights.bold};
    font-size: ${fontSizes['5xl']};
    line-height: ${lineHeights.tight};
    letter-spacing: -0.02em;
  `,
  
  h2: `
    font-family: var(--font-heading);
    font-weight: ${fontWeights.semibold};
    font-size: ${fontSizes['4xl']};
    line-height: ${lineHeights.tight};
    letter-spacing: -0.02em;
  `,
  
  h3: `
    font-family: var(--font-heading);
    font-weight: ${fontWeights.semibold};
    font-size: ${fontSizes['3xl']};
    line-height: ${lineHeights.snug};
    letter-spacing: -0.01em;
  `,
  
  h4: `
    font-family: var(--font-heading);
    font-weight: ${fontWeights.semibold};
    font-size: ${fontSizes['2xl']};
    line-height: ${lineHeights.snug};
    letter-spacing: -0.01em;
  `,
  
  // Body text
  bodyLg: `
    font-family: var(--font-primary);
    font-weight: ${fontWeights.regular};
    font-size: ${fontSizes.lg};
    line-height: ${lineHeights.relaxed};
  `,
  
  bodyMd: `
    font-family: var(--font-primary);
    font-weight: ${fontWeights.regular};
    font-size: ${fontSizes.base};
    line-height: ${lineHeights.relaxed};
  `,
  
  bodySm: `
    font-family: var(--font-primary);
    font-weight: ${fontWeights.regular};
    font-size: ${fontSizes.sm};
    line-height: ${lineHeights.relaxed};
  `,
  
  // Special luxury text
  luxuryLabel: `
    font-family: var(--font-primary);
    font-weight: ${fontWeights.medium};
    font-size: ${fontSizes.xs};
    letter-spacing: ${letterSpacings.luxury};
    text-transform: uppercase;
  `,
};
