// Design tokens extracted from design-system.json for TypeScript usage
export const designTokens = {
  colors: {
    brand: {
      primary: {
        50: '#ECFEFF',
        100: '#CFFAFE',
        200: '#A5F3FC',
        300: '#67E8F9',
        400: '#22D3EE',
        500: '#06B6D4',
        600: '#0891B2',
        700: '#0E7490',
        800: '#155E75',
        900: '#164E63',
        950: '#083344'
      },
      secondary: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        200: '#BFDBFE',
        300: '#93C5FD',
        400: '#60A5FA',
        500: '#3B82F6',
        600: '#2563EB',
        700: '#1D4ED8',
        800: '#1E40AF',
        900: '#1E3A8A',
        950: '#172554'
      }
    },
    background: {
      primary: '#031313',
      secondary: '#0e1f1f',
      tertiary: '#1a3030',
      card: '#0e1f1f',
      glass: 'rgba(14, 31, 31, 0.7)',
      overlay: 'rgba(3, 19, 19, 0.9)'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#E2E8F0',
      tertiary: '#94A3B8',
      muted: '#64748B',
      disabled: '#475569'
    },
    accent: {
      teal: '#06B6D4',
      blue: '#3B82F6',
      green: '#10B981',
      yellow: '#F59E0B',
      red: '#EF4444',
      purple: '#8B5CF6'
    }
  },
  gradients: {
    // Header gradient - ONLY use for headers
    header: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
    headerAlt: 'linear-gradient(to right, #14b8a6 0%, #06b6d4 100%)',
    // Card overlays
    card: 'linear-gradient(180deg, rgba(3, 19, 19, 0) 0%, rgba(3, 19, 19, 0.9) 100%)',
    glass: 'linear-gradient(135deg, rgba(14, 31, 31, 0.7) 0%, rgba(14, 31, 31, 0.85) 100%)',
    ticket: 'linear-gradient(180deg, #0e1f1f 0%, #031313 100%)'
  },
  borderRadius: {
    sm: '0.75rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
  },
  ratings: {
    good: '#10B981',
    average: '#F59E0B',
    poor: '#EF4444'
  }
} as const;

// CSS variable names for easy usage
export const cssVars = {
  // Brand colors
  primaryTeal: 'var(--color-primary-500)',
  primaryBlue: 'var(--color-secondary-500)',
  
  // Backgrounds
  bgPrimary: 'var(--color-bg-primary)',
  bgSecondary: 'var(--color-bg-secondary)',
  bgTertiary: 'var(--color-bg-tertiary)',
  bgCard: 'var(--color-bg-card)',
  bgGlass: 'var(--color-bg-glass)',
  bgOverlay: 'var(--color-bg-overlay)',
  
  // Text colors
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textTertiary: 'var(--color-text-tertiary)',
  textMuted: 'var(--color-text-muted)',
  textDisabled: 'var(--color-text-disabled)',
  
  // Gradients
  gradientHero: 'var(--gradient-hero)',
  gradientCard: 'var(--gradient-card)',
  gradientTeal: 'var(--gradient-teal)',
  gradientGlass: 'var(--gradient-glass)',
  gradientTicket: 'var(--gradient-ticket)',
  
  // Rating colors
  ratingGood: 'var(--color-rating-good)',
  ratingAverage: 'var(--color-rating-average)',
  ratingPoor: 'var(--color-rating-poor)',
  
  // Border radius
  radiusSm: 'var(--radius-sm)',
  radiusBase: 'var(--radius-base)',
  radiusMd: 'var(--radius-md)',
  radiusLg: 'var(--radius-lg)',
  radiusXl: 'var(--radius-xl)',
  radius2xl: 'var(--radius-2xl)',
  radius3xl: 'var(--radius-3xl)',
  radiusFull: 'var(--radius-full)'
} as const;

// Utility function to generate CSS custom properties
export const generateCSSCustomProperties = () => {
  return `
    /* Brand Colors */
    --color-primary-50: ${designTokens.colors.brand.primary[50]};
    --color-primary-100: ${designTokens.colors.brand.primary[100]};
    --color-primary-200: ${designTokens.colors.brand.primary[200]};
    --color-primary-300: ${designTokens.colors.brand.primary[300]};
    --color-primary-400: ${designTokens.colors.brand.primary[400]};
    --color-primary-500: ${designTokens.colors.brand.primary[500]};
    --color-primary-600: ${designTokens.colors.brand.primary[600]};
    --color-primary-700: ${designTokens.colors.brand.primary[700]};
    --color-primary-800: ${designTokens.colors.brand.primary[800]};
    --color-primary-900: ${designTokens.colors.brand.primary[900]};
    --color-primary-950: ${designTokens.colors.brand.primary[950]};
    
    --color-secondary-50: ${designTokens.colors.brand.secondary[50]};
    --color-secondary-100: ${designTokens.colors.brand.secondary[100]};
    --color-secondary-200: ${designTokens.colors.brand.secondary[200]};
    --color-secondary-300: ${designTokens.colors.brand.secondary[300]};
    --color-secondary-400: ${designTokens.colors.brand.secondary[400]};
    --color-secondary-500: ${designTokens.colors.brand.secondary[500]};
    --color-secondary-600: ${designTokens.colors.brand.secondary[600]};
    --color-secondary-700: ${designTokens.colors.brand.secondary[700]};
    --color-secondary-800: ${designTokens.colors.brand.secondary[800]};
    --color-secondary-900: ${designTokens.colors.brand.secondary[900]};
    --color-secondary-950: ${designTokens.colors.brand.secondary[950]};

    /* Background Colors */
    --color-bg-primary: ${designTokens.colors.background.primary};
    --color-bg-secondary: ${designTokens.colors.background.secondary};
    --color-bg-tertiary: ${designTokens.colors.background.tertiary};
    --color-bg-card: ${designTokens.colors.background.card};
    --color-bg-glass: ${designTokens.colors.background.glass};
    --color-bg-overlay: ${designTokens.colors.background.overlay};

    /* Text Colors */
    --color-text-primary: ${designTokens.colors.text.primary};
    --color-text-secondary: ${designTokens.colors.text.secondary};
    --color-text-tertiary: ${designTokens.colors.text.tertiary};
    --color-text-muted: ${designTokens.colors.text.muted};
    --color-text-disabled: ${designTokens.colors.text.disabled};

    /* Accent Colors */
    --color-accent-teal: ${designTokens.colors.accent.teal};
    --color-accent-blue: ${designTokens.colors.accent.blue};
    --color-accent-green: ${designTokens.colors.accent.green};
    --color-accent-yellow: ${designTokens.colors.accent.yellow};
    --color-accent-red: ${designTokens.colors.accent.red};
    --color-accent-purple: ${designTokens.colors.accent.purple};

    /* Rating Colors */
    --color-rating-good: ${designTokens.ratings.good};
    --color-rating-average: ${designTokens.ratings.average};
    --color-rating-poor: ${designTokens.ratings.poor};

    /* Gradients */
    --gradient-header: ${designTokens.gradients.header};
    --gradient-header-alt: ${designTokens.gradients.headerAlt};
    --gradient-card: ${designTokens.gradients.card};
    --gradient-glass: ${designTokens.gradients.glass};
    --gradient-ticket: ${designTokens.gradients.ticket};
  `;
};

// Component styles for easy reuse
export const componentStyles = {
  // Card styles
  card: {
    base: `
      background-color: var(--color-bg-card);
      border-radius: var(--radius-3xl);
      padding: var(--space-6);
      border: 1px solid var(--color-border);
      overflow: hidden;
    `,
    glass: `
      background-color: var(--color-bg-glass);
      border-radius: var(--radius-3xl);
      padding: var(--space-6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: var(--backdrop-blur);
      box-shadow: var(--shadow-glass);
    `
  },
  
  // Button styles
  button: {
    primary: `
      background: var(--gradient-header);
      color: var(--color-text-primary);
      border-radius: var(--radius-full);
      padding: 0.75rem 1.5rem;
      font-weight: 500;
      box-shadow: var(--shadow-md);
    `,
    secondary: `
      background: var(--color-bg-glass);
      color: var(--color-text-primary);
      border-radius: var(--radius-full);
      padding: 0.75rem 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-weight: 500;
      backdrop-filter: var(--backdrop-blur);
    `,
    danger: `
      background: var(--color-accent-red);
      color: var(--color-text-primary);
      border-radius: var(--radius-full);
      padding: 0.75rem 1.5rem;
      font-weight: 500;
    `
  },
  
  // Badge styles
  badge: {
    rating: `
      background-color: var(--color-primary-500);
      color: var(--color-text-primary);
      border-radius: var(--radius-full);
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
    `
  }
} as const;