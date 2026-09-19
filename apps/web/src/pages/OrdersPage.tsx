import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { cancelBooking, getBookings, type Booking } from '../api/client';
import { AppLayout } from '../components/AppLayout';
import { cities } from '../data/cities';
import { useMaxConnection } from '../features/max/useMaxConnection';

type OrderTab = 'completed' | 'upcoming';

function isUpcoming(order: Booking) {
  const today = new Date().toISOString().slice(0, 10);
  return order.status === 'confirmed' && order.date >= today;
}

function formatDate(order: Booking) {
  const [year, month, day] = order.date.split('-').map(Number);
  const date = new Date(year!, month! - 1, day);
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(year === new Date().getFullYear() ? {} : { year: 'numeric' }),
  }).format(date);
  return `${formatted}, ${order.time}`;
}

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>('upcoming');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const { platform, session } = useMaxConnection();
  const initData = platform.initData ?? '';
  const queryClient = useQueryClient();
  const orders = useQuery({
    enabled: Boolean(initData && session.data?.authenticated),
    queryFn: () => getBookings(initData),
    queryKey: ['bookings'],
    retry: false,
  });
  const cancellation = useMutation({
    mutationFn: (id: string) => cancelBooking(initData, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
  const allOrders = orders.data?.items ?? [];
  const upcomingCount = allOrders.filter(isUpcoming).length;
  const completedCount = allOrders.length - upcomingCount;
  const visibleOrders = allOrders.filter((order) =>
    activeTab === 'upcoming' ? isUpcoming(order) : !isUpcoming(order),
  );

  return (
    <AppLayout>
      <main className="secondary-page orders-page">
        <header className="page-header">
          <p className="section-kicker">Ваши поездки</p>
          <h1>Мои заказы</h1>
          <p>Билеты, детали встреч и история ваших впечатлений.</p>
        </header>

        <div aria-label="Фильтр заказов" className="segmented-control">
          <button
            aria-pressed={activeTab === 'upcoming'}
            className={activeTab === 'upcoming' ? 'is-active' : ''}
            onClick={() => setActiveTab('upcoming')}
            type="button"
          >
            Предстоящие <span>{upcomingCount}</span>
          </button>
          <button
            aria-pressed={activeTab === 'completed'}
            className={activeTab === 'completed' ? 'is-active' : ''}
            onClick={() => setActiveTab('completed')}
            type="button"
          >
            История <span>{completedCount}</span>
          </button>
        </div>

        {!initData ? (
          <div className="orders-empty">
            <span aria-hidden="true">🎟️</span>
            <h2>Откройте приложение внутри MAX</h2>
            <p>Тогда мы сможем показать ваши записи.</p>
          </div>
        ) : orders.isPending ? (
          <div className="orders-empty">
            <p>Загружаем заказы…</p>
          </div>
        ) : orders.isError ? (
          <div className="orders-empty">
            <p>Не удалось загрузить заказы.</p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="orders-empty">
            <span aria-hidden="true">🧭</span>
            <h2>
              {activeTab === 'upcoming'
                ? 'Нет предстоящих экскурсий'
                : 'История пока пуста'}
            </h2>
            <p>Выберите экскурсию в каталоге и запишитесь на удобную дату.</p>
          </div>
        ) : (
          <section aria-live="polite" className="order-list">
            {visibleOrders.map((order) => {
              const expanded = expandedOrderId === order.id;
              const city = cities.find((item) => item.id === order.cityId);
              const upcoming = isUpcoming(order);
              const status =
                order.status === 'cancelled'
                  ? 'Отменено'
                  : upcoming
                    ? 'Подтверждено'
                    : 'Завершено';

              return (
                <article className="order-card" key={order.id}>
                  <img alt="" height="560" src={order.imageUrl} width="760" />
                  <div className="order-card__content">
                    <div className="order-card__topline">
                      <span>{city?.name ?? order.cityId}</span>
                      <strong
                        className={
                          upcoming ? 'status-confirmed' : 'status-completed'
                        }
                      >
                        {status}
                      </strong>
                    </div>
                    <h2>{order.title}</h2>
                    <dl className="order-facts">
                      <div>
                        <dt>Дата</dt>
                        <dd>{formatDate(order)}</dd>
                      </div>
                      <div>
                        <dt>Участники</dt>
                        <dd>{order.participants}</dd>
                      </div>
                      <div>
                        <dt>Стоимость</dt>
                        <dd>{order.totalPriceRub.toLocaleString('ru-RU')} ₽</dd>
                      </div>
                    </dl>

                    {expanded ? (
                      <div className="order-details">
                        <div>
                          <span>Номер заказа</span>
                          <strong>{order.id.slice(0, 8).toUpperCase()}</strong>
                        </div>
                        <div>
                          <span>Место встречи</span>
                          <strong>{order.meetingPoint}</strong>
                        </div>
                      </div>
                    ) : null}

                    <button
                      aria-expanded={expanded}
                      className="order-card__action"
                      onClick={() =>
                        setExpandedOrderId(expanded ? null : order.id)
                      }
                      type="button"
                    >
                      {expanded ? 'Скрыть детали' : 'Подробнее о заказе'}
                    </button>
                    {upcoming ? (
                      <button
                        className="order-card__cancel"
                        disabled={cancellation.isPending}
                        onClick={() => cancellation.mutate(order.id)}
                        type="button"
                      >
                        Отменить запись
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </AppLayout>
  );
}
