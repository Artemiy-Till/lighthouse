import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { HomePage } from './HomePage';

describe('HomePage', () => {
  afterEach(() => {
    delete window.WebApp;
  });

  it('filters experience cards by search query', () => {
    render(<HomePage />);

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
    render(<HomePage />);

    fireEvent.click(screen.getByRole('button', { name: /Гастро/ }));
    expect(screen.getByText('Пока ничего не нашли')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(
      screen.getByText('Петербург: первое знакомство'),
    ).toBeInTheDocument();
  });
});
