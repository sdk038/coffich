import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI, normalizeList } from '../lib/api';
import { formatPriceUZS } from '../lib/formatPrice';
import './AuthPages.css';

const ORDER_STATUS_LABELS = {
  new: 'Новый',
  inProgress: 'В работе',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
  in_progress: 'В работе',
};

export default function OrderHistory() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setOrders([]);
      setOrdersLoading(false);
      setOrdersError(null);
      return undefined;
    }

    (async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const res = await fetchAPI('/api/orders/');
        if (!cancelled) {
          setOrders(normalizeList(res));
        }
      } catch (e) {
        if (!cancelled) {
          setOrders([]);
          setOrdersError(e?.message || 'Не удалось загрузить историю заказов.');
        }
      } finally {
        if (!cancelled) {
          setOrdersLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const orderCountLabel = useMemo(() => {
    if (orders.length === 0) return 'Пока заказов нет';
    if (orders.length === 1) return '1 заказ';
    return `${orders.length} заказов`;
  }, [orders.length]);

  if (loading) {
    return (
      <div className="page auth-page">
        <p className="auth-page__lead">Загрузка…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: { pathname: '/profile/orders' } }} />;
  }

  return (
    <div className="page auth-page">
      <div className="auth-page__inner auth-page__inner--wide">
        <div className="profile-page__topbar">
          <Link to="/profile" className="profile-page__back-link">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path
                d="M15 6l-6 6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Назад в профиль
          </Link>
          <p className="profile-page__history-meta">{orderCountLabel}</p>
        </div>

        <h1 className="auth-page__title">История заказов</h1>

        {ordersLoading ? (
          <p className="profile-page__empty">Загружаем архив заказов…</p>
        ) : ordersError ? (
          <p className="auth-form__error">{ordersError}</p>
        ) : orders.length === 0 ? (
          <p className="profile-page__empty">
            Здесь появятся ваши прошлые заказы после первого оформления.
          </p>
        ) : (
          <div className="profile-page__history-list">
            {orders.map((order) => {
              const createdAt = order.createdAt || order.created_at;
              const items = Array.isArray(order.items) ? order.items : [];
              return (
                <article key={order.id} className="profile-order-card">
                  <div className="profile-order-card__head">
                    <div>
                      <h3 className="profile-order-card__title">Заказ #{order.id}</h3>
                      <p className="profile-order-card__date">
                        {createdAt
                          ? new Date(createdAt).toLocaleString('ru-RU')
                          : 'Дата неизвестна'}
                      </p>
                    </div>
                    <span className="profile-order-card__status">
                      {ORDER_STATUS_LABELS[order.status] || order.status || 'Статус неизвестен'}
                    </span>
                  </div>
                  <ul className="profile-order-card__items">
                    {items.map((item) => (
                      <li key={item.id || `${order.id}-${item.title}`} className="profile-order-card__item">
                        <span>{item.title}</span>
                        <span>
                          {item.quantity} x {formatPriceUZS(item.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {order.note && (
                    <p className="profile-order-card__note">Комментарий: {order.note}</p>
                  )}
                  <div className="profile-order-card__footer">
                    <strong>{formatPriceUZS(order.totalSum || order.total_sum || 0)}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
