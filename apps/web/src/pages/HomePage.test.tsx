import { fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { FavoritesProvider } from '../features/favorites/FavoritesContext';
import { HomePage } from './HomePage';

function TestProviders({ children }: { readonly children: ReactNode }) {
  return (
    <MemoryRouter>
      <FavoritesProvider>{children}</FavoritesProvider>
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
});
