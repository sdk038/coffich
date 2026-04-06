import { useShop } from '../context/ShopContext';
import { resolveAboutCoverUrl } from '../lib/coffeeImages';
import './About.css';

export default function About() {
  const { shop, loading, error } = useShop();
  const empty = !loading && !error && !shop;

  if (loading) {
    return (
      <div className="page about">
        <p className="about__state">Загрузка…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page about">
        <p className="about__state about__state--error">{error}</p>
      </div>
    );
  }

  if (empty || !shop) {
    return (
      <div className="page about">
        <p className="about__state">
          Заполните модель Shop в админке Django или выполните{' '}
          <code>python manage.py seed_demo</code>.
        </p>
      </div>
    );
  }

  const cover = resolveAboutCoverUrl(shop);

  return (
    <div className="page about">
      <div
        className="about__cover"
        style={{ backgroundImage: `url(${cover})` }}
      >
        <div className="about__cover-overlay" />
        <div className="about__cover-inner">
          <h1 className="about__title">{shop.shopName}</h1>
          {shop.tagline && <p className="about__tagline">{shop.tagline}</p>}
        </div>
      </div>

      <div className="about__content">
        {shop.about && (
          <div
            className="about__richtext"
            dangerouslySetInnerHTML={{ __html: shop.about }}
          />
        )}
      </div>
    </div>
  );
}
