import { fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CityProvider } from '../features/city/CityContext';
import { ThemeProvider } from '../features/theme/ThemeContext';
import { HomePage } from './HomePage';

vi.mock('../features/max/useMaxConnection', () => ({
  useMaxConnection: () => ({ session: { data: undefined } }),
}));

function TestProviders({ children }: { readonly children: ReactNode }) {
  return (
    <MemoryRouter>
      <ThemeProvider>
        <CityProvider>{children}</CityProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows city tabs and a full-size image for the selected city', () => {
    render(<HomePage />, { wrapper: TestProviders });

    expect(
      screen.getByRole('heading', { name: 'Привет, Артемий!' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Выбери свой город для прогулки'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Открыть профиль' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Открывайте новые места' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Москва' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Казань' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Кострома' }),
    ).toBeInTheDocument();
    expect(
      document.querySelector(
        '.home-selected-city img[src="/images/saint-petersburg-hero.webp"]',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'Смотреть экскурсии — Санкт-Петербург',
      }),
    ).toHaveAttribute('href', '/catalog');
    expect(
      document.querySelector('.home-selected-city__copy'),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('.home-selected-city__action'),
    ).not.toBeInTheDocument();
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
        '.home-selected-city img[src="/images/moscow-kremlin.webp"]',
      ),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem('marketplace-city')).toBe('moscow');
    expect(
      screen.getByRole('link', { name: 'Смотреть экскурсии — Москва' }),
    ).toBeInTheDocument();
  });

  it('keeps search and catalog access on the landing screen', () => {
    render(<HomePage />, { wrapper: TestProviders });

    expect(
      screen.getByRole('searchbox', {
        name: 'Куда или что хотите посмотреть?',
      }),
    ).toBeInTheDocument();
    const catalogButton = screen.getByRole('button', {
      name: 'Открыть каталог',
    });
    expect(catalogButton).toBeInTheDocument();
    expect(catalogButton.querySelector('svg.icon')).toBeInTheDocument();
  });
});
