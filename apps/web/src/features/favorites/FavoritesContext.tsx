import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const storageKey = 'marketplace-favorites';
const defaultFavorites = ['hidden-courtyards', 'drawbridges'];

interface FavoritesContextValue {
  readonly favoriteIds: ReadonlySet<string>;
  readonly toggleFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readStoredFavorites(): string[] {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (value === null) return defaultFavorites;

    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')
      ? parsed
      : defaultFavorites;
  } catch {
    return defaultFavorites;
  }
}

export function FavoritesProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(
    () => new Set(readStoredFavorites()),
  );

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify([...favoriteIds]));
  }, [favoriteIds]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      toggleFavorite: (id) => {
        setFavoriteIds((current) => {
          const next = new Set(current);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      },
    }),
    [favoriteIds],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === null) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
