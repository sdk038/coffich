import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cachedFetchAPI, normalizeList, PUBLIC_CACHE_TTL_MS } from '../lib/api';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductModal from '../components/ProductModal';
import OrderAuthModal from '../components/OrderAuthModal';
import ProductImage from '../components/ProductImage';
import { resolveHeroImageUrl } from '../lib/coffeeImages';
import {
  DEMO_HERO_SLIDES,
  DEMO_PRODUCTS,
  DEMO_SHOP,
  hasMeaningfulShopContent,
} from '../lib/demoContent';
import { formatPriceUZS } from '../lib/formatPrice';
import '../styles/pages/Home.css';

export default function Home() {
  const { shop, locations } = useShop();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [slides, setSlides] = useState(DEMO_HERO_SLIDES);
  const [featured, setFeatured] = useState(
    DEMO_PRODUCTS.filter((item) => item.featured)
  );
  const [modalProduct, setModalProduct] = useState(null);
  const [needAuth, setNeedAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          cachedFetchAPI('/api/hero-slides/', {
            skipAuth: true,
            ttlMs: PUBLIC_CACHE_TTL_MS,
          }),
          cachedFetchAPI('/api/products/?featured=true', {
            skipAuth: true,
            ttlMs: PUBLIC_CACHE_TTL_MS,
          }),
        ]);
        if (!cancelled) {
          const slideItems = normalizeList(sRes);
          const featuredItems = normalizeList(pRes);
          setSlides(slideItems.length ? slideItems : DEMO_HERO_SLIDES);
          setFeatured(
            featuredItems.length
              ? featuredItems
              : DEMO_PRODUCTS.filter((item) => item.featured)
          );
        }
      } catch (e) {
        if (!cancelled) {
          setSlides(DEMO_HERO_SLIDES);
          setFeatured(DEMO_PRODUCTS.filter((item) => item.featured));
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
  const featuredSelection = featured.slice(0, 4);

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
  const displayShop = hasMeaningfulShopContent(shop) ? shop : DEMO_SHOP;

  const title = primary?.title || displayShop.shopName || 'Coffich';
  const lead =
    primary?.subtitle ||
    displayShop.tagline ||
    'Готовим кофе, к которому хочется возвращаться каждый день: от первого эспрессо утром до десерта к вечерней встрече.';

  const serviceHighlights = [
    {
      title: 'Зерно с характером',
      text: 'Собираем меню вокруг понятного вкуса: чистый эспрессо, мягкие молочные напитки и яркие сезонные рецепты.',
    },
    {
      title: 'Комфорт на каждый день',
      text: 'Можно задержаться за ноутбуком, забежать за кофе с собой или оформить быстрый заказ без очереди.',
    },
    {
      title: 'Десерты к напитку',
      text: 'Подбираем выпечку и сладости так, чтобы каждая пара работала вместе: от рафа с чизкейком до американо с банановым хлебом.',
    },
  ];

  const citiesLine =
    locations && locations.length > 0
      ? [...new Set(locations.map((l) => l.city))].join(' · ')
      : null;

  const visitDetails = [
    {
      label: 'Города',
      value: citiesLine || displayShop.address || 'Тёплая локация в Узбекистане',
    },
    { label: 'Время', value: displayShop.hours || 'Ежедневно с раннего утра до позднего вечера' },
    { label: 'Связь', value: displayShop.phone || displayShop.email || 'Напишите нам для предзаказа и вопросов' },
  ];

  return (
    <div className="page home">
      <section className="hero-banner" aria-label="Главный баннер">
        <div className="hero-banner__inner">
          <div className="hero-banner__text">
            <p className="hero-banner__eyebrow">Кофейня</p>
            {locations?.length > 0 && (
              <div className="hero-banner__cities">
                <ul className="hero-banner__cities-grid">
                  {locations.slice(0, 4).map((l) => (
                    <li key={String(l.id ?? l.slug)} className="hero-banner__city-cell">
                      {l.city}
                    </li>
                  ))}
                </ul>
                <Link className="hero-banner__cities-cta" to="/contact">
                  Карта и адреса
                </Link>
              </div>
            )}
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
          <p className="home__eyebrow">Добро пожаловать</p>
          <h2 className="section__title">{displayShop.shopName || 'Coffich'}</h2>
          <p className="section__lead">
            {displayShop.tagline ||
              'Пространство для коротких пауз, длинных разговоров и любимых кофейных ритуалов.'}
          </p>

          <div className="home__highlight-grid">
            {serviceHighlights.map((item) => (
              <article key={item.title} className="home__highlight-card">
                <h3 className="home__highlight-title">{item.title}</h3>
                <p className="home__highlight-text">{item.text}</p>
              </article>
            ))}
          </div>
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
            {featuredSelection.map((item) => (
              <article
                key={item.documentId || item.id}
                className="product-card"
              >
                <div className="product-card__media">
                  <ProductImage
                    product={item}
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
          {featuredSelection.length === 0 && (
            <p className="home__empty">
              Скоро здесь появятся фирменные напитки, десерты и сезонные позиции.
            </p>
          )}
        </div>
      </section>

      <section className="section home__visit">
        <div className="section__inner">
          <div className="home__visit-card">
            <div className="home__visit-copy">
              <p className="home__eyebrow">Планируйте визит</p>
              <h2 className="section__title">Забегайте за кофе утром, встречайтесь у нас днём</h2>
              <p className="section__lead home__visit-lead">
                Мы задумали Coffich как место, которое одинаково хорошо подходит
                для утреннего кофе с собой, спокойного рабочего часа и вечерней
                встречи с друзьями.
              </p>
              <div className="hero-banner__actions home__visit-actions">
                <Link className="btn btn--primary" to="/contact">
                  Контакты
                </Link>
                <Link className="btn btn--ghost" to="/about">
                  О пространстве
                </Link>
              </div>
            </div>

            <div className="home__visit-details">
              {visitDetails.map((item) => (
                <div key={item.label} className="home__visit-detail">
                  <span className="home__visit-label">{item.label}</span>
                  <p className="home__visit-value">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
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
