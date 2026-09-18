import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

function renderApp(initialEntry = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App navigation', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            bot: { id: '1', name: 'Маяк', username: 'mayak_bot' },
            configured: true,
            connected: true,
          }),
          { status: 200 },
        ),
      ),
    );
  });

  it('switches theme and saves the preference', () => {
    renderApp();

    fireEvent.click(
      screen.getByRole('button', { name: 'Включить тёмную тему' }),
    );

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(window.localStorage.getItem('marketplace-theme')).toBe('dark');
    expect(
      screen.getByRole('button', { name: 'Включить светлую тему' }),
    ).toBeInTheDocument();
  });

  it('opens catalog, favorites, orders and profile from the bottom navigation', () => {
    renderApp();

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

  it('shows the verified MAX user returned by the backend', async () => {
    window.WebApp = {
      BackButton: {
        hide() {},
        offClick() {},
        onClick() {},
        show() {},
      },
      initData: 'auth_date=1&hash=signed',
      platform: 'ios',
      version: '26.20.0',
      getViewportSize() {
        return Promise.resolve({ height: '800px', width: '390px' });
      },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const requestUrl =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const isAuthenticationRequest = requestUrl.endsWith('/auth/max');
        const payload = isAuthenticationRequest
          ? {
              authenticated: true,
              user: {
                firstName: 'Мария',
                id: '42',
                languageCode: 'ru',
                lastName: 'Иванова',
                photoUrl: null,
                username: 'maria',
              },
            }
          : {
              bot: { id: '1', name: 'Маяк', username: 'mayak_bot' },
              configured: true,
              connected: true,
            };

        return Promise.resolve(
          new Response(JSON.stringify(payload), { status: 200 }),
        );
      }),
    );

    renderApp('/profile');

    expect(
      await screen.findByRole('heading', { name: 'Мария Иванова' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Профиль MAX')).toBeInTheDocument();
    expect(screen.getByText('@maria')).toBeInTheDocument();
  });

  it('switches order history and expands order details', () => {
    renderApp('/orders');

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
    renderApp('/favorites');

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
    renderApp();

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
    fireEvent.click(screen.getByText('Не подойдёт для'));
    expect(
      screen.getByText('Гости на инвалидных колясках'),
    ).toBeInTheDocument();
    expect(screen.getByText('Дети младше 7 лет')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Что вас ожидает'));
    expect(screen.getByText('Дворцовая площадь')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('link', {
        name: 'Открыть профиль гида Алексей Смирнов',
      }),
    );
    expect(
      screen.getByRole('heading', { name: 'Алексей Смирнов', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Личность подтверждена/)).toBeInTheDocument();
    expect(screen.getByText('Опыт и квалификация')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Экскурсии', level: 2 }),
    ).toBeInTheDocument();
  });

  it('filters and sorts catalog experiences', () => {
    renderApp('/catalog');

    expect(screen.getByText('4 предложения')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Фильтры/ }));
    fireEvent.click(screen.getByLabelText('Подходит с детьми'));
    fireEvent.click(screen.getByRole('button', { name: 'Показать варианты' }));
    expect(screen.getByText('3 предложения')).toBeInTheDocument();
    expect(
      screen.queryByText('Дворы, парадные и старые истории'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Фильтры/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить' }));
    fireEvent.click(screen.getByRole('button', { name: /Фильтры/ }));
    fireEvent.click(screen.getByLabelText('До 1 500 ₽'));
    fireEvent.click(screen.getByRole('button', { name: 'Показать варианты' }));

    expect(screen.getByText('1 предложение')).toBeInTheDocument();
    expect(
      screen.getByText('Петербург: первое знакомство'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Разводные мосты с воды'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Фильтры/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Сортировка' }), {
      target: { value: 'price' },
    });

    expect(screen.getByText('4 предложения')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /Подробнее об экскурсии/ })[0],
    ).toHaveAccessibleName(
      'Подробнее об экскурсии «Петербург: первое знакомство»',
    );
  });
});
