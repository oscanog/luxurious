export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "luxurious-theme-mode";

export function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemeMode(mode: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function persistThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
}
