import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

function renderApp(initialEntry = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { ...view, queryClient };
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

  it('opens settings and applies the English interface', () => {
    renderApp('/profile');

    fireEvent.click(screen.getByRole('link', { name: /Настройки/ }));
    expect(
      screen.getByRole('heading', { name: 'Настройки' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(
      screen.getByRole('heading', { name: 'Settings' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(window.localStorage.getItem('marketplace-language')).toBe('en');

    fireEvent.click(screen.getByRole('switch', { name: /Offers and news/ }));
    expect(window.localStorage.getItem('marketplace-offers')).toBe('true');

    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(
      screen.getByRole('heading', { name: 'See the city in a new way' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Profile' }));
    fireEvent.click(screen.getByRole('link', { name: /Settings/ }));
    fireEvent.click(screen.getByRole('button', { name: 'RU' }));
    fireEvent.click(screen.getByRole('switch', { name: /Скидки и новости/ }));
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

  it('shows a completed state when the MAX user has no username', async () => {
    window.WebApp = {
      BackButton: {
        hide() {},
        offClick() {},
        onClick() {},
        show() {},
      },
      initData: 'auth_date=1&hash=signed',
      platform: 'desktop',
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
        const payload = requestUrl.endsWith('/auth/max')
          ? {
              authenticated: true,
              user: {
                firstName: 'Артемий',
                id: '42',
                languageCode: 'ru',
                lastName: null,
                photoUrl: null,
                username: null,
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
      await screen.findByText('Профиль подтверждён через MAX'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Проверяем данные профиля MAX…'),
    ).not.toBeInTheDocument();
  });

  it('edits an existing guide profile', async () => {
    window.WebApp = {
      BackButton: {
        hide() {},
        offClick() {},
        onClick() {},
        show() {},
      },
      initData: 'auth_date=1&hash=signed',
      platform: 'desktop',
      version: '26.20.0',
      getViewportSize() {
        return Promise.resolve({ height: '800px', width: '390px' });
      },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const requestUrl =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        let payload: unknown;

        if (requestUrl.endsWith('/auth/max')) {
          payload = {
            authenticated: true,
            user: {
              firstName: 'Артемий',
              id: '42',
              languageCode: 'ru',
              lastName: null,
              photoUrl: 'https://example.com/artemiy.jpg',
              username: 'artemiy',
            },
          };
        } else if (requestUrl.endsWith('/professional/profile')) {
          payload =
            init?.method === 'PUT'
              ? {
                  bio: 'Обновлённое описание профессионального гида.',
                  createdAt: '2026-09-19T09:00:00.000Z',
                  displayName: 'Артемий Экскурсовод',
                  id: 'guide-1',
                  photoUrl: 'https://example.com/artemiy.jpg',
                }
              : {
                  bio: 'Профессиональный гид по Санкт-Петербургу.',
                  createdAt: '2026-09-19T09:00:00.000Z',
                  displayName: 'Артемий',
                  id: 'guide-1',
                  photoUrl: 'https://example.com/artemiy.jpg',
                };
        } else if (requestUrl.endsWith('/professional/experiences')) {
          payload = { items: [] };
        } else {
          payload = {
            bot: { id: '1', name: 'Маяк', username: 'mayak_bot' },
            configured: true,
            connected: true,
          };
        }

        return Promise.resolve(
          new Response(JSON.stringify(payload), { status: 200 }),
        );
      }),
    );

    const { queryClient } = renderApp('/professional');
    queryClient.setQueryData(['published-experience', 'tour-1'], {
      guide: {
        bio: 'Старое описание.',
        displayName: 'Артемий',
        id: 'guide-1',
        photoUrl: 'https://example.com/artemiy.jpg',
      },
      id: 'tour-1',
    });

    fireEvent.click(
      await screen.findByRole('button', { name: 'Редактировать профиль' }),
    );
    fireEvent.change(screen.getByLabelText('Имя гида'), {
      target: { value: 'Артемий Экскурсовод' },
    });
    fireEvent.change(screen.getByLabelText('О себе'), {
      target: { value: 'Обновлённое описание профессионального гида.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить профиль' }));

    expect(
      await screen.findByRole('heading', { name: 'Артемий Экскурсовод' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Обновлённое описание профессионального гида.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Редактировать профиль' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Фото профиля Артемий Экскурсовод',
      }),
    ).toHaveAttribute('src', 'https://example.com/artemiy.jpg');
    await waitFor(() =>
      expect(
        queryClient.getQueryState(['published-experience', 'tour-1'])
          ?.isInvalidated,
      ).toBe(true),
    );
    expect(
      queryClient.getQueryData<{ guide: { displayName: string } }>([
        'published-experience',
        'tour-1',
      ])?.guide.displayName,
    ).toBe('Артемий Экскурсовод');
  });

  it('asks to open MAX before showing private orders', () => {
    renderApp('/orders');
    expect(
      screen.getByText('Откройте приложение внутри MAX'),
    ).toBeInTheDocument();
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

  it('keeps a user-published experience in favorites', async () => {
    window.localStorage.setItem('marketplace-favorites', '[]');
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const requestUrl =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const payload = requestUrl.includes('/api/v1/experiences')
          ? {
              items: [
                {
                  category: 'История',
                  children: 'Можно с детьми',
                  cityId: 'saint-petersburg',
                  createdAt: '2026-09-19T09:00:00.000Z',
                  description: 'Авторская прогулка.',
                  durationMinutes: 120,
                  format: 'Пешком',
                  groupSize: 8,
                  groupType: 'Мини-группа',
                  guide: {
                    bio: 'Гид по Петербургу',
                    displayName: 'Артемий',
                    id: 'guide-1',
                    photoUrl: 'https://example.com/artemiy.jpg',
                  },
                  highlights: ['Новая Голландия'],
                  id: 'published-user-tour',
                  intro: 'Увидим город глазами местного жителя.',
                  meetingPoint: 'У входа в Новую Голландию',
                  photos: ['/images/hidden-courtyards.webp'],
                  priceRub: 2200,
                  status: 'published',
                  title: 'Петербург глазами местного',
                },
              ],
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

    renderApp('/catalog');

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Добавить «Петербург глазами местного» в избранное',
      }),
    );
    fireEvent.click(screen.getByRole('link', { name: 'Избранное' }));

    expect(
      await screen.findByText('Петербург глазами местного'),
    ).toBeInTheDocument();
    expect(screen.getByText('Пока нет отзывов')).toBeInTheDocument();
    expect(screen.queryByText('5,0')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('marketplace-favorites')).toContain(
      'published-user-tour',
    );
    window.localStorage.removeItem('marketplace-favorites');
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
