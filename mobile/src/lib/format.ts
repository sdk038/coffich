import { API_BASE_URL } from './config';

const CATEGORY_FALLBACK_IMAGE_MAP: Record<string, string> = {
  signature:
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=560&q=72',
  'espresso-classics':
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=560&q=72',
  'cold-drinks':
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=560&q=72',
  bakery:
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=560&q=72',
  other:
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=560&q=72',
};

const HOME_HERO_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=960&q=72';

export function formatPriceUZS(value: number | string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '—';
  }
  return `${amount.toLocaleString('ru-RU')} сум`;
}

export function mediaUrl(media: any) {
  if (!media) return null;
  const url = media.url || media?.image?.url || '';
  if (!url) return null;
  if (String(url).startsWith('http')) {
    return url;
  }
  return `${API_BASE_URL}${String(url).startsWith('/') ? url : `/${url}`}`;
}

export function productImageUrl(product: any) {
  const directImage = mediaUrl(product?.image);
  if (directImage) {
    return directImage;
  }
  const categorySlug = String(product?.category?.slug || '').trim();
  return (
    CATEGORY_FALLBACK_IMAGE_MAP[categorySlug] ||
    CATEGORY_FALLBACK_IMAGE_MAP.other
  );
}

export function heroImageUrl(hero: any, shop: any) {
  return mediaUrl(hero?.image) || mediaUrl(shop?.coverImage) || HOME_HERO_FALLBACK_IMAGE;
}
