import { useShop } from '../context/ShopContext';
import './Contact.css';

export default function Contact() {
  const { shop, loading, error } = useShop();
  const empty = !loading && !error && !shop;

  if (loading) {
    return (
      <div className="page contact-page">
        <p className="contact-page__state">Загрузка…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page contact-page">
        <p className="contact-page__state contact-page__state--error">{error}</p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="page contact-page">
        <p className="contact-page__state">
          Нет данных Shop. Запустите API и создайте запись в админке Django или
          выполните seed_demo.
        </p>
      </div>
    );
  }

  return (
    <div className="page contact-page">
      <div className="contact-page__inner">
        <h1 className="contact-page__title">Контакты</h1>
        <p className="contact-page__lead">
          Данные из API (модель Shop в админке Django).
        </p>

        <div className="contact-grid">
          <section className="contact-card">
            <h2 className="contact-card__label">Адрес</h2>
            <p className="contact-card__value">{shop.address || '—'}</p>
          </section>
          <section className="contact-card">
            <h2 className="contact-card__label">Телефон</h2>
            {shop.phone ? (
              <a className="contact-card__value" href={`tel:${shop.phone.replace(/\s/g, '')}`}>
                {shop.phone}
              </a>
            ) : (
              <p className="contact-card__value">—</p>
            )}
          </section>
          <section className="contact-card">
            <h2 className="contact-card__label">Email</h2>
            {shop.email ? (
              <a className="contact-card__value" href={`mailto:${shop.email}`}>
                {shop.email}
              </a>
            ) : (
              <p className="contact-card__value">—</p>
            )}
          </section>
          <section className="contact-card contact-card--wide">
            <h2 className="contact-card__label">Часы работы</h2>
            <p className="contact-card__value contact-card__value--pre">
              {shop.hours || '—'}
            </p>
          </section>
        </div>

        {shop.mapEmbedUrl && (
          <div className="contact-map">
            <iframe
              title="Карта"
              src={shop.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>
    </div>
  );
}
