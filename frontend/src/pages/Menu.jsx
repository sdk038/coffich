import { useEffect, useMemo, useState } from 'react';
import { fetchAPI, normalizeList } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductModal from '../components/ProductModal';
import OrderAuthModal from '../components/OrderAuthModal';
import { resolveProductImageUrl, MENU_PAGE_HERO_IMAGE } from '../lib/coffeeImages';
import { formatPriceUZS } from '../lib/formatPrice';
import './Menu.css';

export default function Menu() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);
  const [needAuth, setNeedAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAPI('/api/products/');
        if (!cancelled) setProducts(normalizeList(res));
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const key = p.category?.name || 'Другое';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return map;
  }, [products]);

  const handleOrderProduct = (product) => {
    if (!user) {
      setNeedAuth(true);
      return;
    }
    addItem(product, 1);
  };

  if (loading) {
    return (
      <div className="page menu-page">
        <p className="menu-page__state">Загрузка меню…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="page menu-page">
        <p className="menu-page__state menu-page__state--error">{err}</p>
      </div>
    );
  }

  return (
    <div className="page menu-page">
      <header
        className="menu-page__hero"
        style={{
          backgroundImage: `linear-gradient(160deg, rgba(74, 52, 40, 0.93) 0%, rgba(42, 31, 23, 0.9) 100%), url(${MENU_PAGE_HERO_IMAGE})`,
        }}
      >
        <div className="menu-page__hero-inner">
          <h1 className="menu-page__title">Меню</h1>
          <p className="menu-page__lead">
            Все позиции из API Django — цены и описания меняются в админке.
          </p>
        </div>
      </header>

      <div className="menu-page__body">
        {products.length === 0 ? (
          <p className="menu-page__empty">Пока нет товаров в базе.</p>
        ) : (
          [...byCategory.entries()].map(([catName, items]) => (
            <section key={catName} className="menu-section">
              <h2 className="menu-section__title">{catName}</h2>
              <ul className="menu-section__list">
                {items.map((item) => (
                  <li
                    key={item.documentId || item.id}
                    className="menu-row"
                  >
                    <div className="menu-row__visual">
                      <img
                        src={resolveProductImageUrl(item)}
                        alt={item.title || ''}
                        loading="lazy"
                      />
                    </div>
                    <div className="menu-row__text">
                      <h3 className="menu-row__name">{item.title}</h3>
                      {item.shortDescription && (
                        <p className="menu-row__desc">{item.shortDescription}</p>
                      )}
                    </div>
                    <div className="menu-row__aside">
                      <div className="menu-row__price">
                        {formatPriceUZS(item.price)}
                      </div>
                      <button
                        type="button"
                        className="menu-row__order"
                        onClick={() => setModalProduct(item)}
                      >
                        Заказать
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <ProductModal
        product={modalProduct}
        open={!!modalProduct}
        onClose={() => setModalProduct(null)}
        onOrder={handleOrderProduct}
      />

      <OrderAuthModal open={needAuth} onClose={() => setNeedAuth(false)} />
    </div>
  );
}
