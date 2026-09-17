import { fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { CityProvider } from '../features/city/CityContext';
import { FavoritesProvider } from '../features/favorites/FavoritesContext';
import { HomePage } from './HomePage';

function TestProviders({ children }: { readonly children: ReactNode }) {
  return (
    <MemoryRouter>
      <CityProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </CityProvider>
    </MemoryRouter>
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

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Выбрать город. Сейчас Санкт-Петербург',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: /Москва/ }));

    expect(screen.getByText('Популярное в Москве')).toBeInTheDocument();
    expect(screen.getByText('Москва: первое знакомство')).toBeInTheDocument();
    expect(screen.queryByText('Скоро в Москве')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('marketplace-city')).toBe('moscow');
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
