// Luxury brand color palette
export const colors = {
  // Primary colors
  primary: {
    dark: "#0F1132",
    DEFAULT: "#1A1B40", 
    light: "#2D2F67",
  },
  
  // Accent colors (gold tones)
  accent: {
    dark: "#AA9566",
    DEFAULT: "#C4B087", 
    light: "#D8CEB2",
  },
  
  // Neutrals
  neutral: {
    50: "#F9F9FB",
    100: "#F3F3F6",
    200: "#E9E9EF",
    300: "#D5D5E0",
    400: "#A0A0B2",
    500: "#71718C",
    600: "#4B4B66",
    700: "#323247",
    800: "#232339",
    900: "#18182B",
  },
  
  // UI states
  success: "#2E7D67",
  error: "#D93025",
  warning: "#E7832B",
  info: "#2E5AAC",
  
  // Background shades
  bg: {
    light: "#FFFFFF",
    subtle: "#F9F9FB",
    muted: "#F3F3F6",
  },
  
  // Text shades
  text: {
    primary: "#18182B",
    secondary: "#4B4B66",
    muted: "#71718C",
    light: "#FFFFFF",
  },
  
  // Gradients
  gradients: {
    primary: "linear-gradient(140deg, #1A1B40 0%, #323247 100%)",
    accent: "linear-gradient(140deg, #C4B087 0%, #D8CEB2 100%)",
    luxe: "linear-gradient(140deg, #1A1B40 0%, #2D2F67 50%, #C4B087 100%)",
    subtle: "linear-gradient(140deg, rgba(26, 27, 64, 0.05) 0%, rgba(196, 176, 135, 0.05) 100%)",
  }
};

// Helper functions for converting color values
export function hexToRGBA(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function withOpacity(color: string, opacity: number): string {
  return hexToRGBA(color, opacity);
}