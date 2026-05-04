/**
 * Design System Utility Classes
 * Maps hardcoded values to design system-based Tailwind classes
 */

// Color mappings - replace hardcoded colors with design system equivalents
export const colorMappings = {
  // Background mappings - Updated for new design system
  'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900': 'bg-background-primary',
  'bg-[#031313]': 'bg-background-primary',
  'bg-[#0e1f1f]': 'bg-background-secondary',
  'bg-gray-600/40': 'glass-light',
  'bg-gray-600/60': 'glass-standard',
  'bg-gray-100': 'bg-background-secondary',
  'bg-gray-50': 'bg-background-tertiary',
  'bg-blue-500/10': 'glass-light',
  'bg-blue-500/20': 'bg-accent-teal/20',
  'bg-white/10': 'glass-light',
  'bg-black/80': 'bg-background-secondary/80',
  'bg-black/40': 'bg-background-secondary/40',
  
  // Text color mappings - Updated for new design system
  'text-white': 'text-text-primary',
  'text-white/80': 'text-text-secondary',
  'text-white/70': 'text-text-tertiary',
  'text-white/60': 'text-text-tertiary',
  'text-white/50': 'text-text-muted',
  'text-white/40': 'text-text-muted',
  'text-gray-900': 'text-text-primary',
  'text-gray-800': 'text-text-primary',
  'text-gray-600': 'text-text-secondary',
  'text-gray-400': 'text-text-tertiary',
  'text-gray-300': 'text-text-tertiary',
  'text-blue-400': 'text-accent-teal',
  'text-blue-300': 'text-accent-cyan',
  'text-blue-200': 'text-accent-cyan',
  'text-red-400': 'text-accent-red',
  'text-yellow-400': 'text-accent-yellow',
  'text-teal-400': 'text-accent-teal',
  'text-cyan-400': 'text-accent-cyan',
  
  // Border mappings - Updated for new design system
  'border-blue-500/30': 'border-borders-tealMedium',
  'border-blue-500/20': 'border-borders-medium',
  'border-white/20': 'border-borders-strong',
  'border-white/10': 'border-borders-subtle',
  'border-cyan-400': 'border-accent-cyan',
  'border-teal-400': 'border-accent-teal',
  
  // Hover states - Updated for new design system
  'hover:bg-blue-500/30': 'hover:bg-accent-teal/30',
  'hover:bg-blue-500/20': 'hover:bg-accent-teal/20',
  'hover:bg-blue-500/15': 'hover:bg-accent-teal/15',
  'hover:text-blue-300': 'hover:text-accent-cyan',
  'hover:text-blue-400': 'hover:text-accent-teal',
  'hover:bg-blue-600': 'hover:bg-accent-tealDark',
  'hover:bg-gray-600/60': 'hover:glass-standard',
  'hover:text-gray-600': 'hover:text-text-secondary',
  'hover:bg-teal-500/10': 'hover:bg-accent-teal/10',
  
  // Button mappings - Updated for new design system
  'bg-blue-500': 'bg-accent-teal',
  'bg-blue-600': 'bg-accent-tealDark',
  'bg-teal-500': 'bg-accent-teal',
  'bg-teal-600': 'bg-accent-tealDark',
  'bg-cyan-500': 'bg-accent-cyan',
  'bg-cyan-600': 'bg-accent-cyanDark',
  
  // Gradient mappings - Updated for new design system
  'bg-gradient-to-br from-blue-600 to-blue-800': 'header-gradient',
  'bg-gradient-to-r from-black/60 to-transparent': 'bg-gradient-card-overlay',
  'from-gray-100 to-gray-300': 'glass-light',
  'from-[#00afb2] to-[#005c61]': 'header-gradient',
}

// Class mappings for common component patterns
export const componentMappings = {
  // Search bar
  'bg-blue-500/10 backdrop-blur-sm rounded-2xl flex items-center px-5 py-4 border border-blue-500/20 shadow-lg': 'search-bar flex items-center',
  
  // Glass cards
  'bg-blue-500/10 backdrop-blur-sm rounded-2xl p-4 border border-blue-500/20 shadow-lg': 'glass-card',
  
  // Buttons
  'bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl text-base font-semibold transition-colors shadow-lg': 'btn-primary text-base shadow-lg',
  
  // Navigation tab bar
  'fixed top-0 left-0 right-0 bg-blue-500/10 backdrop-blur-sm border-b border-blue-500/20': 'nav-tab-bar',
}

// Utility functions for easy replacements
export const replaceHardcodedColors = (className: string): string => {
  let result = className
  
  // Replace individual color mappings
  Object.entries(colorMappings).forEach(([hardcoded, designSystem]) => {
    result = result.replace(new RegExp(hardcoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), designSystem)
  })
  
  // Replace component patterns
  Object.entries(componentMappings).forEach(([hardcoded, designSystem]) => {
    result = result.replace(new RegExp(hardcoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), designSystem)
  })
  
  return result
}

// Common design system class combinations
export const designSystemClasses = {
  // Layout
  page: 'flex flex-col min-h-screen bg-background-primary text-text-primary',
  container: 'max-w-container mx-auto px-6',
  
  // Typography
  heading1: 'text-3xl font-bold text-text-primary',
  heading2: 'text-2xl font-semibold text-text-primary',
  heading3: 'text-xl font-semibold text-text-primary',
  body: 'text-base text-text-primary',
  caption: 'text-sm text-text-tertiary',
  
  // Buttons
  buttonPrimary: 'btn-primary',
  buttonSecondary: 'btn-secondary',
  buttonGhost: 'bg-transparent text-text-secondary hover:text-text-primary transition-colors duration-normal',
  
  // Cards
  card: 'glass-card',
  cardVenue: 'card-venue',
  
  // Form elements
  input: 'bg-background-secondary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-tertiary focus:border-primary-500 transition-colors duration-normal',
  searchBar: 'search-bar',
  
  // Navigation
  navTab: 'flex flex-col items-center justify-center gap-1 text-text-tertiary p-2 transition-colors duration-normal',
  navTabActive: 'flex flex-col items-center justify-center gap-1 text-text-primary p-2',
  
  // States
  disabled: 'opacity-50 cursor-not-allowed',
  loading: 'opacity-75 animate-pulse',
  
  // Spacing
  sectionSpacing: 'mb-8',
  elementSpacing: 'mb-6',
  
  // Effects
  glassEffect: 'glass-effect',
  backdropBlur: 'backdrop-blur-glass',
  
  // Animations
  transition: 'transition-all duration-normal ease-in-out',
  hoverScale: 'hover:scale-105 transition-transform duration-normal',
  
  // Gradients
  gradientPrimary: 'bg-gradient-primary',
  gradientSecondary: 'bg-gradient-secondary',
  gradientText: 'gradient-text-primary',
}

// Responsive utilities based on design system breakpoints
export const responsive = {
  mobile: 'max-w-container mx-auto',
  desktop: 'lg:max-w-none lg:mx-0',
}

// Icon color mappings for consistency
export const iconColors = {
  primary: 'text-primary-500',
  secondary: 'text-text-secondary',
  tertiary: 'text-text-tertiary',
  accent: 'text-accent-teal',
  warning: 'text-accent-yellow',
  error: 'text-accent-red',
  success: 'text-accent-green',
}

// Export commonly used class combinations for quick access
export default {
  colorMappings,
  componentMappings,
  replaceHardcodedColors,
  designSystemClasses,
  responsive,
  iconColors,
}