import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  cancelBooking,
  createBookingReview,
  getBookings,
  type Booking,
} from '../api/client';
import { AppLayout } from '../components/AppLayout';
import { cities } from '../data/cities';
import { useMaxConnection } from '../features/max/useMaxConnection';
import { useSettings } from '../features/settings/SettingsContext';

type OrderTab = 'completed' | 'upcoming';

function isUpcoming(order: Booking) {
  const startsAt = new Date(`${order.date}T${order.time}:00`).getTime();
  return order.status === 'confirmed' && startsAt > Date.now();
}

function formatDate(order: Booking, locale: string) {
  const [year, month, day] = order.date.split('-').map(Number);
  const date = new Date(year!, month! - 1, day);
  const formatted = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    ...(year === new Date().getFullYear() ? {} : { year: 'numeric' }),
  }).format(date);
  return `${formatted}, ${order.time}`;
}

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>('upcoming');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const { platform, session } = useMaxConnection();
  const { language, t } = useSettings();
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
  const review = useMutation({
    mutationFn: (value: { comment: string; id: string; rating: number }) =>
      createBookingReview(initData, value.id, {
        comment: value.comment,
        rating: value.rating,
      }),
    onSuccess: async (createdReview) => {
      setReviewingOrderId(null);
      setReviewRating(5);
      setReviewComment('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['published-experiences'] }),
        queryClient.invalidateQueries({ queryKey: ['published-experience'] }),
        queryClient.invalidateQueries({
          queryKey: ['experience-reviews', createdReview.experienceId],
        }),
      ]);
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
          <p className="section-kicker">{t('orders.kicker')}</p>
          <h1>{t('orders.title')}</h1>
          <p>{t('orders.subtitle')}</p>
        </header>

        <div aria-label={t('orders.filter')} className="segmented-control">
          <button
            aria-pressed={activeTab === 'upcoming'}
            className={activeTab === 'upcoming' ? 'is-active' : ''}
            onClick={() => setActiveTab('upcoming')}
            type="button"
          >
            {t('orders.upcoming')} <span>{upcomingCount}</span>
          </button>
          <button
            aria-pressed={activeTab === 'completed'}
            className={activeTab === 'completed' ? 'is-active' : ''}
            onClick={() => setActiveTab('completed')}
            type="button"
          >
            {t('orders.history')} <span>{completedCount}</span>
          </button>
        </div>

        {!initData ? (
          <div className="orders-empty">
            <span aria-hidden="true">🎟️</span>
            <h2>{t('orders.openMax')}</h2>
            <p>{t('orders.openMaxHint')}</p>
          </div>
        ) : orders.isPending ? (
          <div className="orders-empty">
            <p>{t('orders.loading')}</p>
          </div>
        ) : orders.isError ? (
          <div className="orders-empty">
            <p>{t('orders.error')}</p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="orders-empty">
            <span aria-hidden="true">🧭</span>
            <h2>
              {activeTab === 'upcoming'
                ? t('orders.noUpcoming')
                : t('orders.noHistory')}
            </h2>
            <p>{t('orders.emptyHint')}</p>
          </div>
        ) : (
          <section aria-live="polite" className="order-list">
            {visibleOrders.map((order) => {
              const expanded = expandedOrderId === order.id;
              const city = cities.find((item) => item.id === order.cityId);
              const upcoming = isUpcoming(order);
              const status =
                order.status === 'cancelled'
                  ? t('orders.cancelled')
                  : upcoming
                    ? t('orders.confirmed')
                    : t('orders.completed');

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
                        <dt>{t('orders.date')}</dt>
                        <dd>
                          {formatDate(
                            order,
                            language === 'en' ? 'en-US' : 'ru-RU',
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>{t('orders.participants')}</dt>
                        <dd>{order.participants}</dd>
                      </div>
                      <div>
                        <dt>{t('orders.price')}</dt>
                        <dd>
                          {order.totalPriceRub.toLocaleString(
                            language === 'en' ? 'en-US' : 'ru-RU',
                          )}{' '}
                          ₽
                        </dd>
                      </div>
                    </dl>

                    {expanded ? (
                      <div className="order-details">
                        <div>
                          <span>{t('orders.number')}</span>
                          <strong>{order.id.slice(0, 8).toUpperCase()}</strong>
                        </div>
                        <div>
                          <span>{t('orders.meeting')}</span>
                          <strong>{order.meetingPoint}</strong>
                        </div>
                      </div>
                    ) : null}

                    <div
                      className={`order-card__actions${upcoming ? ' order-card__actions--upcoming' : ''}`}
                    >
                      <button
                        aria-expanded={expanded}
                        className="order-card__action"
                        onClick={() =>
                          setExpandedOrderId(expanded ? null : order.id)
                        }
                        type="button"
                      >
                        {expanded ? t('orders.hide') : t('orders.details')}
                      </button>
                      {upcoming ? (
                        <button
                          aria-label={t('orders.cancel')}
                          className="order-card__cancel"
                          disabled={cancellation.isPending}
                          onClick={() => cancellation.mutate(order.id)}
                          type="button"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      ) : null}
                    </div>
                    {!upcoming &&
                    (order.status === 'confirmed' ||
                      order.status === 'completed') ? (
                      order.review ? (
                        <div className="order-review-summary">
                          <strong>
                            {t('orders.yourReview')} ·{' '}
                            {'★'.repeat(order.review.rating)}
                          </strong>
                          <p>{order.review.comment}</p>
                        </div>
                      ) : reviewingOrderId === order.id ? (
                        <form
                          className="order-review-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            review.mutate({
                              comment: reviewComment.trim(),
                              id: order.id,
                              rating: reviewRating,
                            });
                          }}
                        >
                          <fieldset>
                            <legend>{t('orders.reviewRating')}</legend>
                            <div className="order-review-stars">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  aria-label={`${rating} ${t('orders.reviewStars')}`}
                                  aria-pressed={reviewRating === rating}
                                  className={
                                    rating <= reviewRating ? 'is-active' : ''
                                  }
                                  key={rating}
                                  onClick={() => setReviewRating(rating)}
                                  type="button"
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </fieldset>
                          <label>
                            <span>{t('orders.reviewComment')}</span>
                            <textarea
                              maxLength={1000}
                              minLength={5}
                              onChange={(event) =>
                                setReviewComment(event.target.value)
                              }
                              placeholder={t('orders.reviewPlaceholder')}
                              required
                              rows={4}
                              value={reviewComment}
                            />
                          </label>
                          {review.isError ? (
                            <p className="form-error">
                              {t('orders.reviewError')}
                            </p>
                          ) : null}
                          <div className="order-review-form__actions">
                            <button
                              onClick={() => {
                                review.reset();
                                setReviewingOrderId(null);
                                setReviewComment('');
                              }}
                              type="button"
                            >
                              {t('orders.reviewCancel')}
                            </button>
                            <button
                              disabled={
                                review.isPending ||
                                reviewComment.trim().length < 5
                              }
                              type="submit"
                            >
                              {review.isPending
                                ? t('orders.reviewSending')
                                : t('orders.reviewSubmit')}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          className="order-card__review"
                          onClick={() => {
                            review.reset();
                            setReviewRating(5);
                            setReviewComment('');
                            setReviewingOrderId(order.id);
                          }}
                          type="button"
                        >
                          {t('orders.leaveReview')}
                        </button>
                      )
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
