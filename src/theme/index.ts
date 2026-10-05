/** Tokens portados 1:1 desde src/index.css del Figma Make. Ya eran hex. */
export const colors = {
  bgPrimary: "#0b1320",
  bgOuter: "#070d17",
  bgCard: "#131e2e",
  bgCardHover: "#182234",
  bgElevated: "#1c2a3e",
  teal: "#22d3ee",
  tealDim: "#0e7490",
  tealMuted: "rgba(34, 211, 238, 0.15)",
  amber: "#f59e0b",
  amberMuted: "rgba(245, 158, 11, 0.15)",
  success: "#34d399",
  purple: "#a78bfa",
  textPrimary: "#e8f0fe",
  textSecondary: "#8ba0b8",
  textDim: "#4d6178",
  border: "rgba(34, 211, 238, 0.1)",
  borderSubtle: "rgba(255, 255, 255, 0.06)",
  white: "#ffffff",

  // Aliases semánticos compatibles con componentes y pantallas existentes
  background: "#0b1320",
  primary: "#22d3ee",
  danger: "#ef4444",
} as const;

/** Cargar con expo-font: Outfit (títulos) e Inter (cuerpo). */
export const fonts = {
  display: "Outfit_700Bold",
  displaySemiBold: "Outfit_600SemiBold",
  displayMedium: "Outfit_500Medium",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

export const tealGradient = [colors.teal, colors.tealDim] as const;
