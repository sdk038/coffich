import { useEffect, useMemo, useState } from 'react';
import { cachedFetchAPI, normalizeList, PUBLIC_CACHE_TTL_MS } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductModal from '../components/ProductModal';
import OrderAuthModal from '../components/OrderAuthModal';
import { resolveProductImageUrl, MENU_PAGE_HERO_IMAGE } from '../lib/coffeeImages';
import { DEMO_PRODUCTS } from '../lib/demoContent';
import { formatPriceUZS } from '../lib/formatPrice';
import '../styles/pages/Menu.css';

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
        const res = await cachedFetchAPI('/api/products/', {
          skipAuth: true,
          ttlMs: PUBLIC_CACHE_TTL_MS,
        });
        if (!cancelled) {
          const items = normalizeList(res);
          setProducts(items.length ? items : DEMO_PRODUCTS);
        }
      } catch (e) {
        if (!cancelled) {
          setProducts(DEMO_PRODUCTS);
          setErr(null);
        }
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
      const key = p.category?.slug || p.category?.name || 'other';
      if (!map.has(key)) {
        map.set(key, {
          title: p.category?.name || 'Другое',
          description: p.category?.description || '',
          items: [],
        });
      }
      map.get(key).items.push(p);
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
            Собрали напитки и десерты для разных сценариев: быстрый кофе перед
            делами, спокойная пауза в середине дня и что-то особенное к вечерней
            встрече.
          </p>
        </div>
      </header>

      <div className="menu-page__body">
        <div className="menu-page__intro">
          <p>
            В основе меню — классические кофейные позиции, фирменные напитки,
            холодные рецепты и свежая выпечка. Всё готовим так, чтобы вы могли
            выбрать и любимый ежедневный напиток, и что-то новое под настроение.
          </p>
        </div>
        {products.length === 0 ? (
          <p className="menu-page__empty">
            Меню обновляется. Скоро здесь появятся напитки, десерты и сезонные позиции.
          </p>
        ) : (
          [...byCategory.entries()].map(([catKey, section]) => (
            <section key={catKey} className="menu-section">
              <div className="menu-section__head">
                <h2 className="menu-section__title">{section.title}</h2>
                {section.description && (
                  <p className="menu-section__desc">{section.description}</p>
                )}
              </div>
              <ul className="menu-section__list">
                {section.items.map((item) => (
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
