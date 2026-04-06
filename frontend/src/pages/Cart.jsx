import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPriceUZS } from '../lib/formatPrice';
import './Cart.css';

export default function Cart() {
  const { user, loading: authLoading } = useAuth();
  const { items, totalCount, totalSum, setQuantity, removeItem, clear } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="page cart-page">
        <div className="cart-page__inner">
          <h1 className="cart-page__title">Корзина</h1>
          <p className="cart-page__empty">Пока пусто — выберите напитки в меню.</p>
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
            <Link to="/login">Войдите</Link> или{' '}
            <Link to="/register">зарегистрируйтесь</Link>, чтобы оформлять
            заказы.
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
        <p className="cart-page__note">
          Оформление заказа — заглушка: свяжитесь с кофейней по телефону или
          приходите лично.
        </p>
        <Link className="cart-page__checkout" to="/contact">
          Контакты
        </Link>
      </div>
    </div>
  );
}
