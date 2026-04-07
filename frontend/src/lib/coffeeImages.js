/**
 * Красивые фото кофе и кофеен (Unsplash) — показываются, если в Django API нет своего медиа.
 * При загрузке своих картинок в админке они имеют приоритет.
 */
import { mediaUrl } from './api';

const q = 'w=1600&q=82&auto=format&fit=crop';

/** Широкие кадры для hero-слайдов */
const HERO = [
  `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?${q}`,
  `https://images.unsplash.com/photo-1509042239860-f550ce710b93?${q}`,
  `https://images.unsplash.com/photo-1442512595331-e89a7387362c?${q}`,
  `https://images.unsplash.com/photo-1447933601403-0c6688cb5667?${q}`,
];

const SQ = 'w=900&q=82&auto=format&fit=crop';

/** Квадратные кропы для карточек напитков */
const DRINKS = [
  `https://images.unsplash.com/photo-1572442388796-11668a67e53d?${SQ}`,
  `https://images.unsplash.com/photo-1511920170033-f8396924c348?${SQ}`,
  `https://images.unsplash.com/photo-1504639779993-1d15a42fdc5e?${SQ}`,
  `https://images.unsplash.com/photo-1510591508098-sf581c05145a?${SQ}`,
  `https://images.unsplash.com/photo-1509042239860-f550ce710b93?${SQ}`,
  `https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?${SQ}`,
];

const SWEETS = [
  `https://images.unsplash.com/photo-1555507036-ab1f4038808a?${SQ}`,
  `https://images.unsplash.com/photo-1551024506-0bccd828d307?${SQ}`,
  `https://images.unsplash.com/photo-1509440159596-0249088772ff?${SQ}`,
];

const ABOUT_COVER = `https://images.unsplash.com/photo-1501339847302-ac426a4b7cbb?${q}`;

/** Фон шапки страницы «Меню» */
export const MENU_PAGE_HERO_IMAGE = `https://images.unsplash.com/photo-1442512595331-e89a7387362c?${q}`;

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickDrinkByKeywords(slug, title) {
  const t = `${slug || ''} ${title || ''}`.toLowerCase();
  if (/круассан|croissant|десерт|торт|пирог|выпечк|миндаль/i.test(t)) {
    return SWEETS[hashStr(t) % SWEETS.length];
  }
  if (/капучино|cappuccino/i.test(t)) return DRINKS[1];
  if (/флэт|flat\s*white/i.test(t)) return DRINKS[0];
  if (/латте|latte(?!.*flat)/i.test(t)) return DRINKS[2];
  if (/эспрессо|espresso|американо|americano|ристретто/i.test(t)) {
    return DRINKS[3];
  }
  if (/мокко|mocha|раф|raf/i.test(t)) return DRINKS[4];
  if (/какао|cocoa|горячий шоколад/i.test(t)) return DRINKS[5];
  return null;
}

/**
 * URL картинки товара: сначала Django API, иначе подборка Unsplash.
 */
export function resolveProductImageUrl(product) {
  const fromCms = mediaUrl(product?.image);
  if (fromCms) return fromCms;
  const key = `${product?.slug || ''}-${product?.documentId || product?.id || ''}-${product?.title || ''}`;
  const byKw = pickDrinkByKeywords(product?.slug, product?.title);
  if (byKw) return byKw;
  return DRINKS[hashStr(key) % DRINKS.length];
}

/**
 * Фон hero-слайда: Django API или Unsplash по индексу слайда.
 */
export function resolveHeroImageUrl(slide, index) {
  const fromCms = mediaUrl(slide?.image);
  if (fromCms) return fromCms;
  return HERO[index % HERO.length];
}

/** Обложка «О нас», если в Shop нет coverImage */
export function resolveAboutCoverUrl(shop) {
  const fromCms = mediaUrl(shop?.coverImage);
  if (fromCms) return fromCms;
  return ABOUT_COVER;
}
