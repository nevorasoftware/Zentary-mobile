// Tokens de diseño. Los pares texto/fondo marcados como "validado" cumplen WCAG 1.4.3 (>= 4.5:1).
// Verificar con: qa-mobile/contrast/contrast.cjs (fuera del repo, carpeta de QA)
export const colors = {
  primary: '#1D6BE0',
  onPrimary: '#FFFFFF', // sobre primary: 4.96:1
  accent: '#FFCF36',
  background: '#0A0F1F',
  onBackground: '#FFFFFF', // sobre background: 19.07:1
  textOnDarkMuted: '#94A3B8', // sobre background: 7.44:1
  surface: '#FFFFFF',
  text: '#0F172A', // sobre surface: 17.85:1
  textMuted: '#475569', // sobre surface: 7.58:1; sobre surfaceMuted: 6.92:1
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  success: '#047857',
  onSuccess: '#FFFFFF', // sobre success: 5.48:1
  warning: '#92400E',
  warningBg: '#FEF3C7', // warning sobre warningBg: 6.37:1
  danger: '#B91C1C',
  dangerBg: '#FEE2E2', // danger sobre dangerBg: 5.30:1
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const fontSizes = { xs: 11, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24 };
