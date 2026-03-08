import { MD3DarkTheme } from "react-native-paper";

export const ProofTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#00E5FF",
    primaryContainer: "#003544",
    secondary: "#FFB300",
    secondaryContainer: "#3D2E00",
    tertiary: "#A5D6A7",
    background: "#0A0A0F",
    surface: "#1A1A2E",
    surfaceVariant: "#252540",
    error: "#FF5252",
    onPrimary: "#000000",
    onSecondary: "#000000",
    onBackground: "#E8E8F0",
    onSurface: "#E8E8F0",
    onSurfaceVariant: "#A0A0B8",
    outline: "#3A3A55",
    elevation: {
      level0: "transparent",
      level1: "#1A1A2E",
      level2: "#222238",
      level3: "#2A2A45",
      level4: "#303050",
      level5: "#35355A",
    },
  },
};

export const Colors = {
  verified: "#00E5FF",
  verifiedBg: "rgba(0, 229, 255, 0.1)",
  seekerBadge: "#FFB300",
  seekerBadgeBg: "rgba(255, 179, 0, 0.1)",
  skrToken: "#A5D6A7",
  skrTokenBg: "rgba(165, 214, 167, 0.1)",
  dimText: "#6B6B80",
  cardBorder: "#2A2A45",
  cardBg: "#151528",
  panelBg: "#111122",
  softBorder: "rgba(255,255,255,0.08)",
  softShadow: "rgba(0, 0, 0, 0.45)",
};
