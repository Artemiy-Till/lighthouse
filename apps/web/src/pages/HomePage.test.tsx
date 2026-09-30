import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ items: [] }), { status: 200 }),
        ),
      ),
    );
  });

  it('shows the selected city without invented experiences', async () => {
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
      screen.queryByRole('link', { name: /Смотреть все экскурсии/i }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText(
        'Пока нет опубликованных экскурсий в этом городе.',
      ),
    ).toBeInTheDocument();
  });

  it('changes the large image when another city is selected', async () => {
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
      screen.getByRole('heading', { name: 'Популярное в Москве' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Пока нет опубликованных экскурсий в этом городе.',
      ),
    ).toBeInTheDocument();
  });

  it('shows excursions published by users', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [
              {
                category: 'Обзорные',
                cityId: 'saint-petersburg',
                durationMinutes: 120,
                format: 'Пешком',
                id: 'published-tour',
                photos: ['/published.jpg'],
                priceRub: 1500,
                rating: 0,
                reviewCount: 0,
                title: 'Маршрут пользователя',
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    render(<HomePage />, { wrapper: TestProviders });

    expect(await screen.findByText('Маршрут пользователя')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Маршрут пользователя/ }),
    ).toHaveAttribute('href', '/experiences/published-tour');
  });

  it('shows a single full-width search action', () => {
    render(<HomePage />, { wrapper: TestProviders });

    const actions = document.querySelector('.home-discovery__actions');
    const search = screen.getByRole('searchbox', { name: 'Поиск' });

    expect(actions).toContainElement(search);
    expect(actions?.children).toHaveLength(1);
    expect(
      screen.queryByRole('link', { name: /Смотреть все экскурсии/i }),
    ).not.toBeInTheDocument();
  });
});
