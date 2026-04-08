import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ApiHttpError, fetchAPI } from '../lib/api';
import { formatPriceUZS } from '../lib/formatPrice';
import './Cart.css';

export default function Cart() {
  const { user, loading: authLoading } = useAuth();
  const { items, totalCount, totalSum, setQuantity, removeItem, clear } =
    useCart();
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  async function handleCheckout() {
    if (!user || items.length === 0 || pending) return;
    setErr('');
    setInfo('');
    setPending(true);
    try {
      const data = await fetchAPI('/api/orders/checkout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((line) => ({
            key: line.key,
            title: line.title,
            price: Math.round(line.price),
            quantity: line.quantity,
          })),
          note: note.trim(),
        }),
      });
      clear();
      setNote('');
      setInfo(data?.message || 'Заказ отправлен.');
    } catch (ex) {
      setErr(ex instanceof ApiHttpError ? ex.message : 'Не удалось отправить заказ');
    } finally {
      setPending(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="page cart-page">
        <div className="cart-page__inner">
          <h1 className="cart-page__title">Корзина</h1>
          {info ? (
            <p className="cart-page__success">{info}</p>
          ) : (
            <p className="cart-page__empty">Пока пусто — выберите напитки в меню.</p>
          )}
          <Link className="cart-page__link" to="/menu">
            Перейти в меню
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page cart-page">
      <div className="cart-page__inner">
        <div className="cart-page__head">
          <h1 className="cart-page__title">Корзина</h1>
          <button type="button" className="cart-page__clear" onClick={clear}>
            Очистить
          </button>
        </div>

        {!authLoading && !user && (
          <p className="cart-page__auth">
            <Link to="/login">Войдите через Telegram</Link>, чтобы оформлять заказы через
            Telegram.
          </p>
        )}

        <ul className="cart-list">
          {items.map((line) => (
            <li key={line.key} className="cart-line">
              {line.imageUrl ? (
                <img
                  className="cart-line__img"
                  src={line.imageUrl}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <div className="cart-line__ph" aria-hidden />
              )}
              <div className="cart-line__info">
                {line.categoryName && (
                  <span className="cart-line__cat">{line.categoryName}</span>
                )}
                <h2 className="cart-line__title">{line.title}</h2>
                <p className="cart-line__unit">{formatPriceUZS(line.price)} за шт.</p>
              </div>
              <div className="cart-line__qty">
                <button
                  type="button"
                  className="cart-line__qty-btn"
                  onClick={() => setQuantity(line.key, line.quantity - 1)}
                  aria-label="Меньше"
                >
                  −
                </button>
                <span className="cart-line__qty-val">{line.quantity}</span>
                <button
                  type="button"
                  className="cart-line__qty-btn"
                  onClick={() => setQuantity(line.key, line.quantity + 1)}
                  aria-label="Больше"
                >
                  +
                </button>
              </div>
              <div className="cart-line__sum">
                {formatPriceUZS(line.price * line.quantity)}
              </div>
              <button
                type="button"
                className="cart-line__remove"
                onClick={() => removeItem(line.key)}
                aria-label="Удалить"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <div className="cart-page__total">
          <span>Итого ({totalCount} шт.)</span>
          <strong>{formatPriceUZS(totalSum)}</strong>
        </div>

        <div className="cart-page__checkout-box">
          <label className="cart-page__label" htmlFor="order-note">
            Комментарий к заказу
          </label>
          <textarea
            id="order-note"
            className="cart-page__note-input"
            placeholder="Например: без сахара, позвонить перед самовывозом, добавить салфетки"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            maxLength={500}
          />
          {err && <p className="cart-page__error">{err}</p>}
          {info && <p className="cart-page__success">{info}</p>}
          <div className="cart-page__actions">
            <button
              type="button"
              className="cart-page__checkout"
              onClick={handleCheckout}
              disabled={!user || pending}
            >
              {pending ? 'Отправка заказа…' : 'Оформить заказ'}
            </button>
            <Link className="cart-page__contact-link" to="/contact">
              Контакты кофейни
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
