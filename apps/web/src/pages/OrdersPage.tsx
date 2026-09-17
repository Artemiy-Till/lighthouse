import { useState } from 'react';

import { AppLayout } from '../components/AppLayout';

type OrderTab = 'completed' | 'upcoming';

interface DemoOrder {
  readonly city: string;
  readonly date: string;
  readonly id: string;
  readonly image: string;
  readonly meetingPoint: string;
  readonly participants: string;
  readonly price: string;
  readonly status: string;
  readonly tab: OrderTab;
  readonly title: string;
}

const demoOrders: readonly DemoOrder[] = [
  {
    city: 'Санкт-Петербург',
    date: '21 сентября, 12:00',
    id: 'SPB-240921',
    image: '/images/saint-petersburg-hero.webp',
    meetingPoint: 'Исаакиевская площадь, у памятника Николаю I',
    participants: '2 взрослых',
    price: '2 580 ₽',
    status: 'Подтверждено',
    tab: 'upcoming',
    title: 'Петербург: первое знакомство',
  },
  {
    city: 'Москва',
    date: '18 августа, 15:30',
    id: 'MSK-240818',
    image: '/images/moscow-metro.webp',
    meetingPoint: 'Вестибюль станции «Площадь Революции»',
    participants: '1 взрослый',
    price: '1 350 ₽',
    status: 'Завершено',
    tab: 'completed',
    title: 'Подземные дворцы московского метро',
  },
  {
    city: 'Казань',
    date: '4 июля, 19:00',
    id: 'KZN-240704',
    image: '/images/kazan-river.webp',
    meetingPoint: 'Речной порт, причал №3',
    participants: '2 взрослых',
    price: '3 200 ₽',
    status: 'Завершено',
    tab: 'completed',
    title: 'Огни Казани с воды',
  },
];

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>('upcoming');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const visibleOrders = demoOrders.filter((order) => order.tab === activeTab);

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
            Предстоящие
            <span>1</span>
          </button>
          <button
            aria-pressed={activeTab === 'completed'}
            className={activeTab === 'completed' ? 'is-active' : ''}
            onClick={() => setActiveTab('completed')}
            type="button"
          >
            Завершённые
            <span>2</span>
          </button>
        </div>

        <section aria-live="polite" className="order-list">
          {visibleOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;

            return (
              <article className="order-card" key={order.id}>
                <img alt="" height="560" src={order.image} width="760" />
                <div className="order-card__content">
                  <div className="order-card__topline">
                    <span>{order.city}</span>
                    <strong
                      className={
                        order.tab === 'upcoming'
                          ? 'status-confirmed'
                          : 'status-completed'
                      }
                    >
                      {order.status}
                    </strong>
                  </div>
                  <h2>{order.title}</h2>
                  <dl className="order-facts">
                    <div>
                      <dt>Дата</dt>
                      <dd>{order.date}</dd>
                    </div>
                    <div>
                      <dt>Участники</dt>
                      <dd>{order.participants}</dd>
                    </div>
                    <div>
                      <dt>Стоимость</dt>
                      <dd>{order.price}</dd>
                    </div>
                  </dl>

                  {isExpanded ? (
                    <div className="order-details">
                      <div>
                        <span>Номер заказа</span>
                        <strong>{order.id}</strong>
                      </div>
                      <div>
                        <span>Место встречи</span>
                        <strong>{order.meetingPoint}</strong>
                      </div>
                    </div>
                  ) : null}

                  <button
                    aria-expanded={isExpanded}
                    className="order-card__action"
                    onClick={() =>
                      setExpandedOrderId(isExpanded ? null : order.id)
                    }
                    type="button"
                  >
                    {isExpanded ? 'Скрыть детали' : 'Подробнее о заказе'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <p className="prototype-caption">
          Это демонстрационные заказы. После подключения backend здесь появятся
          реальные статусы, билеты и данные оплаты.
        </p>
      </main>
    </AppLayout>
  );
}
