import { createContext, useContext } from "react";

export type ThemePreference = "LIGHT" | "DARK" | "SYSTEM";
export type ResolvedTheme = "light" | "dark";

export type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (nextPreference: ThemePreference) => void;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
