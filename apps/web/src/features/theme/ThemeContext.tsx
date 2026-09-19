import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Theme = 'dark' | 'light';

const storageKey = 'marketplace-theme';

interface ThemeContextValue {
  readonly setTheme: (theme: Theme) => void;
  readonly theme: Theme;
  readonly toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
  try {
    return window.localStorage.getItem(storageKey) === 'dark'
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      setTheme,
      theme,
      toggleTheme: () =>
        setTheme((current) => (current === 'light' ? 'dark' : 'light')),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
