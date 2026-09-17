import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { cities, type City, type CityId } from '../../data/cities';

const defaultCity = cities[0]!;
const storageKey = 'marketplace-city';

interface CityContextValue {
  readonly city: City;
  readonly selectCity: (id: CityId) => void;
}

const CityContext = createContext<CityContextValue | null>(null);

function readStoredCity() {
  const storedId = window.localStorage.getItem(storageKey);
  return cities.find((city) => city.id === storedId) ?? defaultCity;
}

export function CityProvider({ children }: { readonly children: ReactNode }) {
  const [city, setCity] = useState<City>(readStoredCity);

  useEffect(() => {
    window.localStorage.setItem(storageKey, city.id);
  }, [city]);

  const value = useMemo<CityContextValue>(
    () => ({
      city,
      selectCity: (id) => {
        setCity(cities.find((item) => item.id === id) ?? defaultCity);
      },
    }),
    [city],
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const context = useContext(CityContext);
  if (context === null) {
    throw new Error('useCity must be used within CityProvider');
  }
  return context;
}
