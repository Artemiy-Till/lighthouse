import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App navigation', () => {
  it('opens catalog, favorites, orders and profile from the bottom navigation', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Каталог' }));
    expect(
      screen.getByRole('heading', { name: 'Каталог впечатлений' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Избранное' }));
    expect(
      screen.getByRole('heading', { name: 'Избранное' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Заказы' }));
    expect(
      screen.getByRole('heading', { name: 'Мои заказы' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Профиль' }));
    expect(
      screen.getByRole('heading', { name: 'Артемий' }),
    ).toBeInTheDocument();
  });

  it('switches order history and expands order details', () => {
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Петербург: первое знакомство'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Завершённые/ }));
    expect(
      screen.getByText('Подземные дворцы московского метро'),
    ).toBeInTheDocument();
    expect(screen.getByText('Огни Казани с воды')).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Подробнее о заказе' })[0]!,
    );
    expect(screen.getByText('MSK-240818')).toBeInTheDocument();
  });

  it('removes saved experiences and shows the empty state', () => {
    render(
      <MemoryRouter initialEntries={['/favorites']}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Удалить «Дворы, парадные и старые истории» из избранного',
      }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Удалить «Разводные мосты с воды» из избранного',
      }),
    );

    expect(screen.getByText('Здесь пока пусто')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Перейти в каталог' }),
    ).toHaveAttribute('href', '/catalog');
  });

  it('opens an experience card and shows its complete details', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole('link', {
        name: 'Подробнее об экскурсии «Петербург: первое знакомство»',
      }),
    );

    expect(
      screen.getByRole('heading', {
        name: 'Петербург: первое знакомство',
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Мини-группа')).toBeInTheDocument();
    expect(screen.getByText('До 12 человек')).toBeInTheDocument();
    expect(screen.getByText('Об экскурсии')).toBeInTheDocument();
    expect(screen.getByText('Условия бронирования')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Что вас ожидает'));
    expect(screen.getByText('Дворцовая площадь')).toBeInTheDocument();
  });
});
