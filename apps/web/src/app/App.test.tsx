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

    fireEvent.click(screen.getByRole('link', { name: 'Профиль' }));
    fireEvent.click(screen.getByRole('switch', { name: /Тёмная тема/ }));

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(window.localStorage.getItem('marketplace-theme')).toBe('dark');
    expect(screen.getByRole('switch', { name: /Тёмная тема/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
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
      screen.getByRole('heading', { name: 'Санкт-Петербург', level: 1 }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Profile' }));
    fireEvent.click(screen.getByRole('link', { name: /Settings/ }));
    fireEvent.click(screen.getByRole('button', { name: 'RU' }));
    fireEvent.click(screen.getByRole('switch', { name: /Скидки и новости/ }));
  });

  it('returns to the profile from settings and the guide dashboard', () => {
    renderApp('/settings');

    fireEvent.click(screen.getByRole('link', { name: 'Вернуться в профиль' }));
    expect(
      screen.getByRole('heading', { name: 'Артемий', level: 1 }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /Кабинет гида/ }));
    expect(
      screen.getByRole('heading', {
        name: 'Профессиональный аккаунт',
        level: 1,
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Вернуться в профиль' }));
    expect(
      screen.getByRole('heading', { name: 'Артемий', level: 1 }),
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

    renderApp();

    expect(
      await screen.findByRole('heading', {
        name: 'Санкт-Петербург',
        level: 1,
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Профиль' }));

    expect(
      await screen.findByRole('heading', { name: 'Мария Иванова' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Профиль подтверждён')).toBeInTheDocument();
    expect(screen.queryByText('Профиль MAX')).not.toBeInTheDocument();
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
    const openMaxLink = vi.fn();
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
      openMaxLink,
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
        } else if (requestUrl.endsWith('/professional/schedule')) {
          payload = {
            items: [
              {
                bookingCount: 2,
                capacity: 8,
                date: '2099-09-19',
                experienceId: 'tour-1',
                guests: [
                  {
                    bookingId: 'booking-guest-1',
                    guestName: 'Мария Иванова',
                    maxUserId: '84',
                    participants: 1,
                    username: 'maria',
                  },
                  {
                    bookingId: 'booking-guest-2',
                    guestName: 'Иван Петров',
                    maxUserId: '85',
                    participants: 1,
                    username: 'ivan',
                  },
                ],
                participants: 2,
                status: 'scheduled',
                time: '12:00',
                title: 'Петербург глазами местного',
              },
            ],
          };
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
    fireEvent.change(screen.getByLabelText('Имя'), {
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
      screen.getByText('Профиль подтверждён через MAX'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Редактировать профиль' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Фото профиля Артемий Экскурсовод',
      }),
    ).toHaveAttribute('src', 'https://example.com/artemiy.jpg');
    expect(
      screen.getByRole('heading', {
        name: 'Архив гида',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Петербург глазами местного')).toBeInTheDocument();
    const mariaChat = screen.getByRole('link', {
      name: 'Открыть чат: Мария Иванова',
    });
    expect(mariaChat).toHaveAttribute('href', 'https://max.ru/maria');
    fireEvent.click(mariaChat);
    await waitFor(() =>
      expect(openMaxLink).toHaveBeenCalledWith('https://max.ru/maria'),
    );
    expect(screen.getByText('Мария Иванова')).toBeInTheDocument();
    expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Открыть чат: Иван Петров' }),
    ).toHaveAttribute('href', 'https://max.ru/ivan');
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

  it('opens the guide chat from an upcoming booking', async () => {
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
                firstName: 'Мария',
                id: '42',
                languageCode: 'ru',
                lastName: null,
                photoUrl: null,
                username: 'maria',
              },
            }
          : requestUrl.endsWith('/bookings')
            ? {
                items: [
                  {
                    cityId: 'saint-petersburg',
                    createdAt: '2026-09-21T08:00:00.000Z',
                    date: '2099-10-10',
                    experienceId: 'experience-1',
                    guideContact: {
                      displayName: 'Артемий',
                      maxUserId: '84',
                      username: 'artemiy',
                    },
                    id: 'booking-1',
                    imageUrl: '/images/saint-petersburg-hero.webp',
                    meetingPoint: 'Дворцовая площадь',
                    participants: 2,
                    review: null,
                    status: 'confirmed',
                    time: '12:00',
                    title: 'Петербург: первое знакомство',
                    totalPriceRub: 2580,
                    unitPriceRub: 1290,
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

    renderApp('/orders');

    expect(
      await screen.findByRole('link', { name: 'Написать гиду в MAX' }),
    ).toHaveAttribute('href', 'https://max.ru/artemiy');
  });

  it('shows the guide chat for a legacy booking without a saved username', async () => {
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
              ? input.toString()
              : input.url;
        const payload = requestUrl.endsWith('/auth/max')
          ? {
              authenticated: true,
              user: {
                firstName: 'Мария',
                id: '42',
                languageCode: 'ru',
                lastName: null,
                photoUrl: null,
                username: 'maria',
              },
            }
          : requestUrl.endsWith('/bookings')
            ? {
                items: [
                  {
                    cityId: 'kostroma',
                    createdAt: '2026-09-21T08:00:00.000Z',
                    date: '2099-10-10',
                    experienceId: 'experience-1',
                    guideContact: {
                      displayName: 'Артемий',
                      maxUserId: '84',
                      username: null,
                    },
                    id: 'booking-1',
                    imageUrl: '/images/kostroma-card.webp',
                    meetingPoint: 'Центр города',
                    participants: 1,
                    review: null,
                    status: 'confirmed',
                    time: '12:00',
                    title: 'Прогулка по Костроме',
                    totalPriceRub: 1500,
                    unitPriceRub: 1500,
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

    renderApp('/orders');

    expect(
      await screen.findByRole('link', { name: 'Написать гиду в MAX' }),
    ).toHaveAttribute('href', 'max://user/84');
  });

  it('publishes a review from a completed booking', async () => {
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
    let savedReview: { comment: string; rating: number } | null = null;
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
              firstName: 'Мария',
              id: '42',
              languageCode: 'ru',
              lastName: null,
              photoUrl: null,
              username: 'maria',
            },
          };
        } else if (requestUrl.endsWith('/bookings/booking-1/review')) {
          if (typeof init?.body !== 'string') {
            throw new Error('Expected a JSON review body');
          }
          savedReview = JSON.parse(init.body) as {
            comment: string;
            rating: number;
          };
          payload = {
            bookingId: 'booking-1',
            createdAt: '2026-09-19T10:00:00.000Z',
            experienceId: 'experience-1',
            id: 'review-1',
            ...savedReview,
          };
        } else if (requestUrl.endsWith('/bookings')) {
          payload = {
            items: [
              {
                cityId: 'saint-petersburg',
                createdAt: '2026-09-10T10:00:00.000Z',
                date: '2000-01-01',
                experienceId: 'experience-1',
                id: 'booking-1',
                imageUrl: '/images/saint-petersburg-hero.webp',
                meetingPoint: 'Дворцовая площадь',
                participants: 2,
                review: savedReview
                  ? {
                      createdAt: '2026-09-19T10:00:00.000Z',
                      id: 'review-1',
                      ...savedReview,
                    }
                  : null,
                status: 'confirmed',
                time: '12:00',
                title: 'Петербург: первое знакомство',
                totalPriceRub: 2580,
                unitPriceRub: 1290,
              },
            ],
          };
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

    renderApp('/orders');
    fireEvent.click(await screen.findByRole('button', { name: 'История 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Оставить отзыв' }));
    fireEvent.click(screen.getByRole('button', { name: '4 звёзд' }));
    fireEvent.change(screen.getByLabelText('Комментарий'), {
      target: { value: 'Очень интересная экскурсия.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Опубликовать' }));

    expect(await screen.findByText(/Ваш отзыв · ★★★★/)).toBeInTheDocument();
    expect(savedReview).toEqual({
      comment: 'Очень интересная экскурсия.',
      rating: 4,
    });
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

  it('shows reviews on a user-published experience', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const requestUrl =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        let payload: unknown;

        if (requestUrl.endsWith('/experiences/published-user-tour/reviews')) {
          payload = {
            items: [
              {
                authorName: 'Мария Иванова',
                authorPhotoUrl: 'https://example.com/maria.jpg',
                comment: 'Гид отлично знает город и интересно рассказывает.',
                createdAt: '2026-09-20T08:00:00.000Z',
                id: 'review-1',
                rating: 5,
              },
            ],
          };
        } else if (requestUrl.endsWith('/experiences/published-user-tour')) {
          payload = {
            availableSlots: [],
            category: 'История',
            children: 'Можно с детьми',
            cityId: 'saint-petersburg',
            createdAt: '2026-09-19T09:00:00.000Z',
            description: 'Авторская прогулка по городу с местным гидом.',
            durationMinutes: 120,
            format: 'Пешком',
            groupSize: 8,
            groupType: 'Авторская экскурсия',
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
            rating: 5,
            reviewCount: 1,
            status: 'published',
            title: 'Петербург глазами местного',
          };
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

    renderApp('/experiences/published-user-tour');

    expect(
      await screen.findByRole('heading', { name: 'Отзывы гостей' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Мария Иванова')).toBeInTheDocument();
    expect(
      screen.getByText('Гид отлично знает город и интересно рассказывает.'),
    ).toBeInTheDocument();
    expect(screen.getByText('20 сентября 2026 г.')).toBeInTheDocument();
  });

  it('opens an experience card and shows its complete details', () => {
    renderApp();

    fireEvent.click(screen.getByRole('link', { name: 'Все' }));

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
    expect(screen.getByText('Санкт-Петербург')).toBeInTheDocument();
    expect(screen.queryByText(/⌖/)).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByLabelText('Без детей'));
    fireEvent.click(screen.getByRole('button', { name: 'Показать варианты' }));
    expect(screen.getByText('1 предложение')).toBeInTheDocument();
    expect(
      screen.getByText('Дворы, парадные и старые истории'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Петербург: первое знакомство'),
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

  it('searches the catalog by URL, details and small typos', () => {
    renderApp('/catalog?query=парадние');

    const search = screen.getByRole('searchbox', {
      name: 'Найти экскурсию',
    });
    expect(search).toHaveValue('парадние');
    expect(screen.getByText('1 предложение')).toBeInTheDocument();
    expect(
      screen.getByText('Дворы, парадные и старые истории'),
    ).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'катер мосты' } });

    expect(screen.getByText('1 предложение')).toBeInTheDocument();
    expect(screen.getByText('Разводные мосты с воды')).toBeInTheDocument();
    expect(
      screen.queryByText('Дворы, парадные и старые истории'),
    ).not.toBeInTheDocument();
  });
});
