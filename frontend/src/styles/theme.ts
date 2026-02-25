export const THEMES = {
  midnight: {
    bg: "#001220",
    surface: "#002845",
    accent: "#00E0D0",
    text: "#E0E0E0",
  },
  ocean: {
    bg: "#001B2E",
    surface: "#003554",
    accent: "#00A8E8",
    text: "#E0FBFC",
  },
  sunset: {
    bg: "#1A0F1F",
    surface: "#2D1B36",
    accent: "#FF4D80",
    text: "#FFE0E9",
  },
  forest: {
    bg: "#0A120A",
    surface: "#1B2E1B",
    accent: "#4CAF50",
    text: "#E8F5E9",
  },
};

export type ThemeType = keyof typeof THEMES;
