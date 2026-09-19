import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CityProvider } from '../features/city/CityContext';
import { FavoritesProvider } from '../features/favorites/FavoritesContext';
import { ThemeProvider } from '../features/theme/ThemeContext';
import { HomePage } from './HomePage';

function TestProviders({ children }: { readonly children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ThemeProvider>
          <CityProvider>
            <FavoritesProvider>{children}</FavoritesProvider>
          </CityProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('HomePage', () => {
  afterEach(() => {
    delete window.WebApp;
  });

  it('filters experience cards by search query', () => {
    render(<HomePage />, { wrapper: TestProviders });

    fireEvent.change(
      screen.getByPlaceholderText('Куда или что хотите посмотреть?'),
      { target: { value: 'мосты' } },
    );

    expect(screen.getByText('Разводные мосты с воды')).toBeInTheDocument();
    expect(
      screen.queryByText('Форты и маяки Кронштадта'),
    ).not.toBeInTheDocument();
  });

  it('shows and resets the empty state for a category without demo cards', () => {
    render(<HomePage />, { wrapper: TestProviders });

    fireEvent.click(screen.getByRole('button', { name: /Гастро/ }));
    expect(screen.getByText('Пока ничего не нашли')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(
      screen.getByText('Петербург: первое знакомство'),
    ).toBeInTheDocument();
  });

  it('selects a city and shows its experiences', () => {
    render(<HomePage />, { wrapper: TestProviders });

    expect(
      screen.getByRole('button', {
        name: 'Выбрать город. Сейчас Санкт-Петербург',
      }),
    ).toContainElement(
      document.querySelector('img[src="/images/saint-petersburg-hero.webp"]'),
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Выбрать город. Сейчас Санкт-Петербург',
      }),
    );
    expect(
      screen.getByRole('button', { name: 'Санкт-Петербург. 4 предложения' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Москва. 4 предложения' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Казань. 4 предложения' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Кострома. 4 предложения' }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Москва. 4 предложения' }),
    );

    expect(screen.getByText('Популярное в Москве')).toBeInTheDocument();
    expect(screen.getByText('Москва: первое знакомство')).toBeInTheDocument();
    expect(screen.queryByText('Скоро в Москве')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('marketplace-city')).toBe('moscow');
    expect(
      screen.getByRole('button', { name: 'Выбрать город. Сейчас Москва' }),
    ).toContainElement(
      document.querySelector('img[src="/images/moscow-kremlin.webp"]'),
    );
  });

  it('includes published guide experiences in the city offer count', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const requestUrl =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const items = requestUrl.endsWith('/experiences')
          ? [
              {
                availableSlots: [],
                category: 'Обзорные',
                children: 'Можно с детьми',
                cityId: 'moscow',
                createdAt: '2026-09-19T09:00:00.000Z',
                description: 'Авторская экскурсия по Москве.',
                durationMinutes: 120,
                format: 'Пешком',
                groupSize: 10,
                groupType: 'Групповая',
                guide: {
                  bio: 'Гид по Москве',
                  displayName: 'Артемий',
                  id: 'guide-1',
                  photoUrl: null,
                },
                highlights: [],
                id: 'published-moscow-tour',
                intro: 'Прогулка по центру.',
                meetingPoint: 'Красная площадь',
                photos: [],
                priceRub: 1500,
                rating: 0,
                reviewCount: 0,
                status: 'published',
                title: 'Москва глазами гида',
              },
            ]
          : [];

        return Promise.resolve(
          new Response(JSON.stringify({ items }), { status: 200 }),
        );
      }),
    );

    render(<HomePage />, { wrapper: TestProviders });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Выбрать город. Сейчас Санкт-Петербург',
      }),
    );

    expect(
      await screen.findByRole('button', { name: 'Москва. 5 предложений' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Санкт-Петербург. 4 предложения',
      }),
    ).toBeInTheDocument();
  });

  it('selects and resets an excursion date', () => {
    render(<HomePage />, { wrapper: TestProviders });

    fireEvent.click(screen.getByRole('button', { name: 'Любая дата' }));
    expect(
      screen.getByRole('heading', { name: 'Выберите дату' }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Или выберите день в календаре'), {
      target: { value: '2027-05-16' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Показать варианты' }));

    expect(
      screen.getByRole('button', { name: /16 мая 2027/ }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /16 мая 2027/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Любая дата' }));

    expect(
      screen.getByRole('button', { name: 'Любая дата' }),
    ).toBeInTheDocument();
  });
});
