import React, { useCallback, useEffect, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { ProductCard } from '../components/ProductCard';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { StateCard } from '../components/StateCard';
import { useCart } from '../contexts/CartContext';
import { normalizeList, requestJson } from '../lib/api';
import { colors } from '../theme/colors';
import { heroImageUrl } from '../lib/format';
import { normalizeHeroSlide, normalizeProduct, normalizeShop } from '../lib/normalize';

export function HomeScreen({ navigation }: any) {
  const { addItem } = useCart();
  const [shop, setShop] = useState<any>(null);
  const [slides, setSlides] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHome = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [shopRes, slidesRes, productsRes] = await Promise.all([
        requestJson('/api/shop/'),
        requestJson('/api/hero-slides/'),
        requestJson('/api/products/?featured=true'),
      ]);
      setShop(normalizeShop(shopRes));
      setSlides(normalizeList(slidesRes).map(normalizeHeroSlide));
      setFeatured(normalizeList(productsRes).map(normalizeProduct));
    } catch (ex: any) {
      setError(ex?.message || 'Не удалось загрузить главную страницу.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  const hero = slides[0];
  const coverImage = heroImageUrl(hero, shop);

  if (loading) {
    return (
      <Screen centered scroll={false}>
        <StateCard
          loading
          title="Загружаем главную"
          description="Подтягиваем витрину, hero-блок и популярные позиции."
        />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen centered scroll={false}>
        <StateCard
          title="Главная временно недоступна"
          description={error}
          actionLabel="Повторить"
          onActionPress={() => {
            void loadHome();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ImageBackground source={{ uri: coverImage }} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroOverlay} />
        <View style={styles.heroInner}>
          <Text style={styles.heroEyebrow}>Coffich</Text>
          <Text style={styles.heroTitle}>{hero?.title || shop?.shopName || 'Coffich'}</Text>
          <Text style={styles.heroLead}>
            {hero?.subtitle ||
              shop?.tagline ||
              'Кофе, десерты и тёплая пауза в ритме большого города.'}
          </Text>
          <Pressable style={styles.heroButton} onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.heroButtonText}>Открыть меню</Text>
          </Pressable>
        </View>
      </ImageBackground>

      <View style={styles.quickStats}>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>{featured.length || 0}</Text>
          <Text style={styles.quickStatLabel}>хитов в подборке</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>7 дней</Text>
          <Text style={styles.quickStatLabel}>сессия без лишнего входа</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>1 тап</Text>
          <Text style={styles.quickStatLabel}>до добавления в корзину</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <SectionHeader
            eyebrow="Выбор гостей"
            title="Популярные позиции"
            description="Самые частые заказы, которые удобно добавить в корзину за пару касаний."
          />
        </View>
        <Pressable onPress={() => navigation.navigate('Menu')}>
          <Text style={styles.sectionLink}>Всё меню</Text>
        </Pressable>
      </View>

      {featured.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Скоро здесь появятся позиции</Text>
          <Text style={styles.emptyText}>Как только загрузим витрину, самые популярные товары появятся на главной.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {featured.map((item) => (
            <ProductCard
              key={String(item.documentId || item.id)}
              product={item}
              onAdd={addItem}
              compact
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    minHeight: 300,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 22,
    backgroundColor: colors.surfaceMuted,
  },
  heroImage: {
    borderRadius: 28,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(32, 20, 12, 0.45)',
  },
  heroInner: {
    padding: 24,
    justifyContent: 'flex-end',
    flex: 1,
  },
  heroEyebrow: {
    color: '#efd6be',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 12,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroLead: {
    color: '#fff5ea',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    maxWidth: 300,
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  heroButtonText: {
    color: colors.accentDark,
    fontWeight: '800',
  },
  quickStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickStat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickStatValue: {
    color: colors.accentDark,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  quickStatLabel: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  sectionLink: {
    color: colors.accentDark,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});
