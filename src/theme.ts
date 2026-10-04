import { Platform } from "react-native";

export const colors = {
  bg: "#eef3f2",
  surface: "#ffffff",
  ink: "#10302e",
  muted: "#5b706e",
  line: "#d5e0de",
  brand: "#0f766e",
  brandDark: "#0b5a54",
  tint: "#e3f3f0",
  danger: "#b42318",
};

export const radius = { sm: 8, md: 12 };

export const fonts = {
  family: Platform.select({
    ios: "System",
    android: "Roboto",
    web: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    default: "sans-serif",
  }),
};

