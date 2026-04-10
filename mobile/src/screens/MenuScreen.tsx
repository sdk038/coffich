import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProductCard } from '../components/ProductCard';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { StateCard } from '../components/StateCard';
import { useCart } from '../contexts/CartContext';
import { normalizeList, requestJson } from '../lib/api';
import { normalizeProduct } from '../lib/normalize';
import { colors } from '../theme/colors';

export function MenuScreen() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestJson('/api/products/');
      setProducts(normalizeList(res).map(normalizeProduct));
    } catch (ex: any) {
      setError(ex?.message || 'Не удалось загрузить меню.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; items: any[] }>();
    for (const product of products) {
      const key = product.category?.slug || product.category?.name || 'other';
      if (!map.has(key)) {
        map.set(key, {
          title: product.category?.name || 'Другое',
          items: [],
        });
      }
      map.get(key)?.items.push(product);
    }
    return [...map.values()];
  }, [products]);

  if (loading) {
    return (
      <Screen centered scroll={false}>
        <StateCard
          loading
          title="Загружаем меню"
          description="Собираем каталог напитков и десертов."
        />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen centered scroll={false}>
        <StateCard
          title="Не удалось загрузить меню"
          description={error}
          actionLabel="Повторить"
          onActionPress={() => {
            void loadMenu();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionHeader
        eyebrow="Каталог"
        title="Меню"
        description="Напитки и десерты для короткой паузы, работы или встречи."
      />

      <View style={styles.overviewCard}>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewValue}>{products.length}</Text>
          <Text style={styles.overviewLabel}>позиций</Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewValue}>{grouped.length}</Text>
          <Text style={styles.overviewLabel}>категорий</Text>
        </View>
      </View>

      {grouped.map((group) => (
        <View key={group.title} style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <Text style={styles.sectionMeta}>{group.items.length} шт.</Text>
          </View>
          <View style={styles.grid}>
            {group.items.map((item) => (
              <ProductCard
                key={String(item.documentId || item.id)}
                product={item}
                onAdd={addItem}
                compact
              />
            ))}
          </View>
        </View>
      ))}
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
  overviewCard: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 22,
  },
  overviewItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overviewValue: {
    color: colors.accentDark,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  overviewLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  section: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.accentDark,
    fontSize: 22,
    fontWeight: '800',
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
