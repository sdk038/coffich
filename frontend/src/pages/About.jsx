import { useShop } from '../context/ShopContext';
import { resolveAboutCoverUrl } from '../lib/coffeeImages';
import { DEMO_SHOP, hasMeaningfulShopContent } from '../lib/demoContent';
import './About.css';

export default function About() {
  const { shop, loading, error } = useShop();
  const displayShop = hasMeaningfulShopContent(shop) ? shop : DEMO_SHOP;
  const empty = !loading && !error && !displayShop;
  const values = [
    {
      title: 'Кофе без снобизма',
      text: 'Мы любим качественное зерно и понятную подачу. Напиток должен быть вкусным и удобным для повседневной жизни.',
    },
    {
      title: 'Тёплый сервис',
      text: 'Важно не только то, что в чашке, но и как вас встречают: быстро, спокойно и по-доброму.',
    },
    {
      title: 'Место для паузы',
      text: 'Coffich задуман как городская точка притяжения: для короткой остановки, работы с ноутбуком и живых разговоров.',
    },
  ];

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

  if (empty || !displayShop) {
    return (
      <div className="page about">
        <p className="about__state">
          История кофейни скоро появится здесь вместе с рассказом о команде,
          напитках и атмосфере пространства.
        </p>
      </div>
    );
  }

  const cover = resolveAboutCoverUrl(displayShop);

  return (
    <div className="page about">
      <div
        className="about__cover"
        style={{ backgroundImage: `url(${cover})` }}
      >
        <div className="about__cover-overlay" />
        <div className="about__cover-inner">
          <h1 className="about__title">{displayShop.shopName}</h1>
          {displayShop.tagline && <p className="about__tagline">{displayShop.tagline}</p>}
        </div>
      </div>

      <div className="about__content">
        <div className="about__intro">
          <p className="about__eyebrow">О кофейне</p>
          <h2 className="about__section-title">Место, куда хочется возвращаться</h2>
          <p className="about__section-lead">
            Мы строим Coffich вокруг простого ощущения: хороший кофе должен
            сопровождать ваш день, а пространство вокруг него должно давать
            ощущение комфорта, ритма и заботы.
          </p>
        </div>

        {displayShop.about && (
          <div
            className="about__richtext"
            dangerouslySetInnerHTML={{ __html: displayShop.about }}
          />
        )}

        <div className="about__values">
          {values.map((item) => (
            <article key={item.title} className="about__value-card">
              <h3 className="about__value-title">{item.title}</h3>
              <p className="about__value-text">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
