import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAPI, normalizeList } from '../lib/api';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductModal from '../components/ProductModal';
import OrderAuthModal from '../components/OrderAuthModal';
import { resolveHeroImageUrl, resolveProductImageUrl } from '../lib/coffeeImages';
import { formatPriceUZS } from '../lib/formatPrice';
import './Home.css';

export default function Home() {
  const { shop } = useShop();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [slides, setSlides] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);
  const [needAuth, setNeedAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          fetchAPI('/api/hero-slides/'),
          fetchAPI('/api/products/?featured=true'),
        ]);
        if (!cancelled) {
          setSlides(normalizeList(sRes));
          setFeatured(normalizeList(pRes));
        }
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

  if (loading) {
    return (
      <div className="page home">
        <p className="home__state">Загрузка…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="page home">
        <p className="home__state home__state--error">{err}</p>
      </div>
    );
  }

  const primary = slides[0];
  const secondary = slides[1];

  const handleOrderProduct = (product) => {
    if (!user) {
      setNeedAuth(true);
      return;
    }
    addItem(product, 1);
  };

  const heroImageUrl = primary
    ? resolveHeroImageUrl(primary, 0)
    : resolveHeroImageUrl({}, 0);

  const title = primary?.title || shop?.shopName || 'Coffich';
  const lead =
    primary?.subtitle ||
    shop?.tagline ||
    'Добавьте первый слайд в Strapi (Hero Slide) или заполните данные кофейни.';

  return (
    <div className="page home">
      <section className="hero-banner" aria-label="Главный баннер">
        <div className="hero-banner__inner">
          <div className="hero-banner__text">
            <p className="hero-banner__eyebrow">Кофейня</p>
            <h1 className="hero-banner__title">{title}</h1>
            <p className="hero-banner__lead">{lead}</p>
            {secondary && (secondary.title || secondary.subtitle) && (
              <p className="hero-banner__accent">
                {secondary.title && (
                  <strong className="hero-banner__accent-title">
                    {secondary.title}
                  </strong>
                )}
                {secondary.title && secondary.subtitle ? ' — ' : null}
                {secondary.subtitle || ''}
              </p>
            )}
            <div className="hero-banner__actions">
              <Link
                className="btn btn--primary"
                to={primary?.buttonLink || '/menu'}
              >
                {primary?.buttonText || 'Меню'}
              </Link>
              {secondary ? (
                <Link
                  className="btn btn--ghost"
                  to={secondary.buttonLink || '/about'}
                >
                  {secondary.buttonText || 'О кофейне'}
                </Link>
              ) : (
                <Link className="btn btn--ghost" to="/about">
                  О нас
                </Link>
              )}
            </div>
          </div>
          <div className="hero-banner__visual">
            <div className="hero-banner__frame">
              <img
                src={heroImageUrl}
                alt=""
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section home__intro">
        <div className="section__inner">
          {shop && (
            <>
              <p className="home__eyebrow">Добро пожаловать</p>
              <h2 className="section__title">{shop.shopName || 'Coffich'}</h2>
              {shop.tagline && (
                <p className="section__lead">{shop.tagline}</p>
              )}
            </>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section__inner">
          <div className="section__head">
            <h2 className="section__title">Выбор гостей</h2>
            <Link className="section__more" to="/menu">
              Всё меню →
            </Link>
          </div>
          <div className="card-grid">
            {featured.map((item) => (
              <article
                key={item.documentId || item.id}
                className="product-card"
              >
                <div className="product-card__media">
                  <img
                    src={resolveProductImageUrl(item)}
                    alt={item.title || 'Напиток'}
                    loading="lazy"
                  />
                </div>
                <div className="product-card__body">
                  {item.category?.name && (
                    <span className="product-card__cat">
                      {item.category.name}
                    </span>
                  )}
                  <h3 className="product-card__title">{item.title}</h3>
                  {item.shortDescription && (
                    <p className="product-card__desc">{item.shortDescription}</p>
                  )}
                  <div className="product-card__footer">
                    <p className="product-card__price">
                      {formatPriceUZS(item.price)}
                    </p>
                    <button
                      type="button"
                      className="product-card__btn"
                      onClick={() => setModalProduct(item)}
                    >
                      Заказать
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {featured.length === 0 && (
            <p className="home__empty">Отметьте товары как «featured» в админке Django.</p>
          )}
        </div>
      </section>

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
