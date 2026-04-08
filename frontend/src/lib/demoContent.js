export const DEMO_SHOP = {
  shopName: 'Coffich',
  tagline: 'Кофе, десерты и спокойная атмосфера в ритме большого города.',
  about:
    '<p><strong>Coffich</strong> — городская кофейня, где specialty-зерно, комфортный сервис и тёплая атмосфера соединяются в одном пространстве. Это место для утреннего кофе с собой, дневной встречи и спокойного вечера.</p><p>В нашем меню — классические кофейные напитки, авторские позиции, холодные рецепты и свежая выпечка. Всё собрано так, чтобы можно было найти любимую классику и открыть что-то новое.</p><p>Мы любим понятные вкусы, красивую подачу и ощущение заботы в деталях — от первой чашки до финального десерта.</p>',
  address: 'Ташкент, ул. Шота Руставели, 12',
  phone: '+998 90 123 45 67',
  email: 'hello@coffich.local',
  hours: 'Пн–Пт: 08:00 – 22:00\nСб–Вс: 09:00 – 23:00',
  mapEmbedUrl: '',
  coverImage: null,
};

export const DEMO_HERO_SLIDES = [
  {
    id: 'demo-hero-1',
    title: 'Coffich',
    subtitle:
      'Уютная городская кофейня со specialty-зерном, авторскими напитками и выпечкой, которую хочется заказать ещё до первого глотка.',
    buttonText: 'Открыть меню',
    buttonLink: '/menu',
  },
  {
    id: 'demo-hero-2',
    title: 'Завтрак, встреча, пауза',
    subtitle:
      'Заходите утром за бодрым капучино, днём за холодным эспрессо-тоником, а вечером — за десертом и спокойной атмосферой.',
    buttonText: 'Наша история',
    buttonLink: '/about',
  },
];

export const DEMO_PRODUCTS = [
  {
    id: 'demo-1',
    documentId: 'demo-1',
    title: 'Coffich Honey',
    slug: 'coffich-honey',
    description:
      '<p>Фирменный напиток кофейни: двойной эспрессо, кремовая текстура и мягкий медовый акцент в послевкусии.</p>',
    shortDescription: 'Эспрессо, сливочный крем и лёгкая медовая нота',
    price: '29000',
    featured: true,
    category: {
      name: 'Авторские напитки',
      slug: 'signature',
      description: 'Фирменные рецепты, где классика встречается с сезонными вкусами.',
    },
  },
  {
    id: 'demo-2',
    documentId: 'demo-2',
    title: 'Апельсиновый раф',
    slug: 'orange-raf',
    description:
      '<p>Мягкий авторский раф с натуральной цитрусовой свежестью и тёплым ванильным ароматом.</p>',
    shortDescription: 'Раф на сливках с цедрой апельсина и ванилью',
    price: '31000',
    featured: true,
    category: {
      name: 'Авторские напитки',
      slug: 'signature',
      description: 'Фирменные рецепты, где классика встречается с сезонными вкусами.',
    },
  },
  {
    id: 'demo-3',
    documentId: 'demo-3',
    title: 'Капучино',
    slug: 'cappuccino',
    description:
      '<p>Сбалансированный вкус с мягкой сладостью молока и узнаваемым кофейным характером.</p>',
    shortDescription: 'Эспрессо, молоко и воздушная сливочная пенка',
    price: '22000',
    featured: true,
    category: {
      name: 'Эспрессо-классика',
      slug: 'espresso-classics',
      description: 'Сбалансированные кофейные напитки на каждый день.',
    },
  },
  {
    id: 'demo-4',
    documentId: 'demo-4',
    title: 'Флэт уайт',
    slug: 'flat-white',
    description:
      '<p>Более кофейный и плотный по вкусу, чем латте: любимец тех, кто выбирает насыщенность и микропену.</p>',
    shortDescription: 'Двойной эспрессо и бархатное молоко',
    price: '24000',
    featured: true,
    category: {
      name: 'Эспрессо-классика',
      slug: 'espresso-classics',
      description: 'Сбалансированные кофейные напитки на каждый день.',
    },
  },
  {
    id: 'demo-5',
    documentId: 'demo-5',
    title: 'Айс латте',
    slug: 'iced-latte',
    description:
      '<p>Освежающий и лёгкий вариант для тёплого дня, когда хочется кофе без тяжести.</p>',
    shortDescription: 'Холодный латте со льдом и мягкой кремовой подачей',
    price: '26000',
    featured: false,
    category: {
      name: 'Холодные напитки',
      slug: 'cold-drinks',
      description: 'Освежающие позиции для жаркого дня и лёгких встреч.',
    },
  },
  {
    id: 'demo-6',
    documentId: 'demo-6',
    title: 'Эспрессо-тоник',
    slug: 'espresso-tonic',
    description:
      '<p>Контрастный напиток с бодрящей кислинкой и сухим освежающим послевкусием.</p>',
    shortDescription: 'Игристый тоник, эспрессо и лёгкая цитрусовая горечь',
    price: '28000',
    featured: true,
    category: {
      name: 'Холодные напитки',
      slug: 'cold-drinks',
      description: 'Освежающие позиции для жаркого дня и лёгких встреч.',
    },
  },
  {
    id: 'demo-7',
    documentId: 'demo-7',
    title: 'Круассан с миндальным кремом',
    slug: 'almond-croissant',
    description:
      '<p>Свежеиспечённый круассан с мягким миндальным кремом и лёгкой карамельной корочкой.</p>',
    shortDescription: 'Слоёный круассан с нежной ореховой начинкой',
    price: '21000',
    featured: false,
    category: {
      name: 'Выпечка и десерты',
      slug: 'bakery',
      description: 'Свежая выпечка, которая отлично сочетается с кофе.',
    },
  },
  {
    id: 'demo-8',
    documentId: 'demo-8',
    title: 'Чизкейк сан-себастьян',
    slug: 'san-sebastian-cheesecake',
    description:
      '<p>Кремовый десерт с деликатной текстурой, который отлично подчеркивает молочные кофейные напитки.</p>',
    shortDescription: 'Нежный чизкейк с карамельной корочкой',
    price: '26000',
    featured: false,
    category: {
      name: 'Выпечка и десерты',
      slug: 'bakery',
      description: 'Свежая выпечка, которая отлично сочетается с кофе.',
    },
  },
];

export function hasMeaningfulShopContent(shop) {
  return Boolean(
    shop &&
      (shop.shopName ||
        shop.tagline ||
        shop.about ||
        shop.address ||
        shop.phone ||
        shop.email ||
        shop.hours)
  );
}
