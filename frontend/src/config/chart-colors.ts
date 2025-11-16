// Colores para gráficas y charts
// Extraídos de las variables CSS de Tailwind v4

// Función helper para obtener colores de CSS
const getCSSColor = (variable: string, fallback: string): string => {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value || fallback;
};

// Colores principales del tema
export const CHART_COLORS = {
  // Color primario (coral)
  primary: getCSSColor('--color-coral-500', '#ff6b35'),
  primaryLight: getCSSColor('--color-coral-100', '#ffe8dc'),

  // Colores semánticos
  success: getCSSColor('--color-success-500', '#22c55e'),
  successDark: getCSSColor('--color-success-600', '#16a34a'),
  info: getCSSColor('--color-info-500', '#3b82f6'),
  infoDark: getCSSColor('--color-info-600', '#2563eb'),
  error: getCSSColor('--color-error-500', '#ef4444'),
  errorDark: getCSSColor('--color-error-600', '#dc2626'),
  warning: getCSSColor('--color-arena-500', '#eab308'),

  // Grises estructurales (cemento/piedra)
  border: getCSSColor('--color-piedra-200', '#d1d1d1'),
  grid: getCSSColor('--color-piedra-200', '#d1d1d1'),
  text: getCSSColor('--color-cemento-600', '#6a6760'),
  textLight: getCSSColor('--color-cemento-500', '#7f7c72'),

  // Fondo
  background: '#ffffff',
} as const;

// Colores para tooltips
export const TOOLTIP_STYLE = {
  backgroundColor: CHART_COLORS.background,
  border: `1px solid ${CHART_COLORS.border}`,
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
} as const;

// Colores para ejes
export const AXIS_STYLE = {
  tick: { fill: CHART_COLORS.text, fontSize: 12 },
  tickLine: { stroke: CHART_COLORS.grid },
} as const;

// Colores para CartesianGrid
export const GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: CHART_COLORS.grid,
} as const;
