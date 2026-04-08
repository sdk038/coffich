import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import './OrderAuthModal.css';

export default function OrderAuthModal({ open, onClose }) {
  if (!open) return null;

  const node = (
    <div className="order-auth-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="order-auth-modal__backdrop"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div className="order-auth-modal__panel">
        <button
          type="button"
          className="order-auth-modal__close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>
        <h2 className="order-auth-modal__title">Сначала войдите в аккаунт</h2>
        <p className="order-auth-modal__text">
          Чтобы добавить позиции в корзину и оформить заказ, введите имя,
          фамилию и номер телефона. Мы переведём вас в Telegram-бот, где придёт
          4-значный код для входа.
        </p>
        <div className="order-auth-modal__actions">
          <Link
            className="order-auth-modal__btn order-auth-modal__btn--primary"
            to="/login"
            onClick={onClose}
          >
            Войти через Telegram
          </Link>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
