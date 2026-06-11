import {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  ThemeContext,
  type ResolvedTheme,
  type ThemeContextValue,
  type ThemePreference,
} from "./theme-context";

const THEME_STORAGE_KEY = "stratix-theme-preference";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "LIGHT" || value === "DARK" || value === "SYSTEM";
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "SYSTEM") {
    return getSystemTheme();
  }

  return preference === "DARK" ? "dark" : "light";
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "LIGHT";
  }

  const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(storedPreference) ? storedPreference : "LIGHT";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [preference, setPreference] = useState<ThemePreference>(() => readStoredPreference());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(readStoredPreference()),
  );

  useEffect(() => {
    const nextResolvedTheme = resolveTheme(preference);
    setResolvedTheme(nextResolvedTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  }, [preference]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (preference === "SYSTEM") {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light");
      }
    };

    handleChange();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);

      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }

    mediaQuery.addListener(handleChange);

    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }, [preference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
      toggleTheme: () => {
        setPreference(resolvedTheme === "dark" ? "LIGHT" : "DARK");
      },
    }),
    [preference, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
