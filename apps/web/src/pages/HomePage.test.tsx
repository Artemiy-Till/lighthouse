import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { CityProvider } from '../features/city/CityContext';
import { ThemeProvider } from '../features/theme/ThemeContext';
import { HomePage } from './HomePage';

function TestProviders({ children }: { readonly children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CityProvider>{children}</CityProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the selected city and popular experiences', () => {
    render(<HomePage />, { wrapper: TestProviders });

    expect(
      screen.getByRole('heading', { name: 'Санкт-Петербург', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Открыть профиль' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Выберите город' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Популярное в Петербурге' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Москва' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Казань' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Кострома' }),
    ).toBeInTheDocument();
    expect(
      document.querySelector(
        '.home-discovery__hero > img[src="/images/saint-petersburg-hero.webp"]',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'Смотреть экскурсии — Санкт-Петербург',
      }),
    ).toHaveAttribute('href', '/catalog');
    expect(screen.getByText('Разводные мосты с воды')).toBeInTheDocument();
  });

  it('changes the large image when another city is selected', () => {
    render(<HomePage />, { wrapper: TestProviders });

    fireEvent.click(screen.getByRole('button', { name: 'Москва' }));

    expect(screen.getByRole('button', { name: 'Москва' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      document.querySelector(
        '.home-discovery__hero > img[src="/images/moscow-kremlin.webp"]',
      ),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem('marketplace-city')).toBe('moscow');
    expect(
      screen.getByRole('link', { name: 'Смотреть экскурсии — Москва' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Популярное в Москве' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Москва: первое знакомство')).toBeInTheDocument();
  });

  it('shows search and catalog actions on the same level', () => {
    render(<HomePage />, { wrapper: TestProviders });

    expect(
      screen.getByRole('searchbox', {
        name: 'Поиск',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'Смотреть экскурсии — Санкт-Петербург',
      }),
    ).toBeInTheDocument();
    expect(document.querySelector('.home-discovery__actions')).toContainElement(
      screen.getByRole('searchbox', { name: 'Поиск' }),
    );
  });
});
