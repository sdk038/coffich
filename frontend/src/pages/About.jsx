import { useShop } from '../context/ShopContext';
import { resolveAboutCoverUrl } from '../lib/coffeeImages';
import { DEMO_SHOP, hasMeaningfulShopContent } from '../lib/demoContent';
import './About.css';

export default function About() {
  const { shop, loading, error } = useShop();
  const displayShop = hasMeaningfulShopContent(shop) ? shop : DEMO_SHOP;
  const empty = !loading && !error && !displayShop;
  const quickFacts = [
    {
      label: 'Формат',
      value: 'Кофейня на каждый день',
    },
    {
      label: 'Атмосфера',
      value: 'Спокойная, тёплая, городская',
    },
    {
      label: 'Для кого',
      value: 'Для встреч, пауз и кофе навынос',
    },
  ];
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
  const shopDetails = [
    { label: 'Адрес', value: displayShop.address || 'Уютная локация в центре города' },
    { label: 'Режим работы', value: displayShop.hours || 'Каждый день с утра до вечера' },
    { label: 'Связь', value: displayShop.phone || displayShop.email || 'Остаёмся на связи для заказов и вопросов' },
  ];

  return (
    <div className="page about">
      <div
        className="about__cover"
        style={{ backgroundImage: `url(${cover})` }}
      >
        <div className="about__cover-overlay" />
        <div className="about__cover-inner">
          <p className="about__cover-eyebrow">О пространстве</p>
          <h1 className="about__title">{displayShop.shopName}</h1>
          {displayShop.tagline && <p className="about__tagline">{displayShop.tagline}</p>}
          <p className="about__hero-text">
            Место, куда заходят за кофе, а возвращаются за ощущением спокойствия,
            внимания к деталям и понятного городского ритма.
          </p>
          <div className="about__facts">
            {quickFacts.map((item) => (
              <div key={item.label} className="about__fact-card">
                <span className="about__fact-label">{item.label}</span>
                <p className="about__fact-value">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="about__content">
        <section className="about__story">
          <div className="about__intro">
            <p className="about__eyebrow">О кофейне</p>
            <h2 className="about__section-title">Место, куда хочется возвращаться</h2>
            <p className="about__section-lead">
              Мы строим Coffich вокруг простого ощущения: хороший кофе должен
              сопровождать ваш день, а пространство вокруг него должно давать
              ощущение комфорта, ритма и заботы.
            </p>
          </div>

          <div className="about__story-layout">
            <div className="about__story-main">
              {displayShop.about ? (
                <div
                  className="about__richtext"
                  dangerouslySetInnerHTML={{ __html: displayShop.about }}
                />
              ) : (
                <div className="about__richtext">
                  <p>
                    Coffich задуман как спокойная городская кофейня, где можно
                    одинаково органично взять напиток с собой, провести короткую
                    деловую встречу или устроить небольшую паузу в середине дня.
                  </p>
                  <p>
                    Нам важны не только вкус и качество напитков, но и то, как
                    человек чувствует себя внутри пространства: легко, понятно и
                    без лишней спешки.
                  </p>
                </div>
              )}
            </div>

            <aside className="about__details-card">
              <p className="about__details-eyebrow">Что важно для нас</p>
              <div className="about__details-list">
                {shopDetails.map((item) => (
                  <div key={item.label} className="about__details-row">
                    <span className="about__details-label">{item.label}</span>
                    <p className="about__details-value">{item.value}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="about__values-section">
          <div className="about__values-head">
            <p className="about__eyebrow">Почему возвращаются</p>
            <h2 className="about__section-title">То, что делает Coffich своим</h2>
          </div>
          <div className="about__values">
            {values.map((item, index) => (
              <article key={item.title} className="about__value-card">
                <span className="about__value-index">0{index + 1}</span>
                <h3 className="about__value-title">{item.title}</h3>
                <p className="about__value-text">{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
