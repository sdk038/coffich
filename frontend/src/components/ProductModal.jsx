import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { resolveProductImageUrl } from '../lib/coffeeImages';
import { formatPriceUZS } from '../lib/formatPrice';
import '../styles/components/ProductModal.css';

export default function ProductModal({
  product,
  open,
  onClose,
  onOrder,
}) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !product) return null;

  const img = resolveProductImageUrl(product);
  const descHtml = product.description;
  const hasLongDesc =
    typeof descHtml === 'string' && descHtml.trim().length > 0;

  const handleOrder = () => {
    onOrder?.(product);
    onClose();
  };

  const node = (
    <div
      className="product-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <button
        type="button"
        className="product-modal__backdrop"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div className="product-modal__panel" ref={closeRef}>
        <button
          type="button"
          className="product-modal__close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>
        <div className="product-modal__grid">
          <div className="product-modal__media">
            {img ? (
              <img src={img} alt="" />
            ) : (
              <div className="product-modal__media-ph" aria-hidden />
            )}
          </div>
          <div className="product-modal__body">
            {product.category?.name && (
              <p className="product-modal__cat">{product.category.name}</p>
            )}
            <h2 id="product-modal-title" className="product-modal__title">
              {product.title}
            </h2>
            <p className="product-modal__price">{formatPriceUZS(product.price)}</p>
            {product.shortDescription && (
              <p className="product-modal__short">{product.shortDescription}</p>
            )}
            {hasLongDesc && (
              <div
                className="product-modal__richtext"
                dangerouslySetInnerHTML={{ __html: descHtml }}
              />
            )}
            {!hasLongDesc && !product.shortDescription && (
              <p className="product-modal__empty-desc">
                Подробное описание можно добавить в админке Django (поле
                description).
              </p>
            )}
            <div className="product-modal__footer">
              <button
                type="button"
                className="product-modal__order"
                onClick={handleOrder}
              >
                Заказать
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
