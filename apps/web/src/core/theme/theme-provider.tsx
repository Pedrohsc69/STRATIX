import {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { getSession, subscribeToSessionChanges, type SessionState } from "../../store/app-store";
import {
  ThemeContext,
  type ResolvedTheme,
  type ThemeContextValue,
  type ThemePreference,
} from "./theme-context";

const LEGACY_THEME_STORAGE_KEY = "stratix-theme-preference";

function getThemeStorageKey(session: SessionState | null) {
  if (!session?.user.id) {
    return null;
  }

  return `stratix-theme:${session.user.id}`;
}

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

function readStoredPreference(session: SessionState | null): ThemePreference {
  if (typeof window === "undefined") {
    return "LIGHT";
  }

  const themeStorageKey = getThemeStorageKey(session);

  if (!themeStorageKey) {
    return "LIGHT";
  }

  const storedPreference = window.localStorage.getItem(themeStorageKey);
  return isThemePreference(storedPreference) ? storedPreference : "LIGHT";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionState | null>(() => getSession());
  const [preference, setPreference] = useState<ThemePreference>(() => readStoredPreference(getSession()));
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(readStoredPreference(getSession())),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
  }, []);

  useEffect(() => {
    return subscribeToSessionChanges(() => {
      setSession(getSession());
    });
  }, []);

  useEffect(() => {
    const nextPreference = readStoredPreference(session);
    setPreference(nextPreference);
    setResolvedTheme(resolveTheme(nextPreference));
  }, [session]);

  useEffect(() => {
    const nextResolvedTheme = resolveTheme(preference);
    setResolvedTheme(nextResolvedTheme);

    const themeStorageKey = getThemeStorageKey(session);
    if (!themeStorageKey || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(themeStorageKey, preference);
  }, [preference, session]);

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
