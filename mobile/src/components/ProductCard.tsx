import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { formatPriceUZS, productImageUrl } from '../lib/format';
import { normalizeProduct } from '../lib/normalize';

type Props = {
  product: any;
  onAdd: (product: any) => void;
  compact?: boolean;
};

function buildFallbackLabel(title: string) {
  const words = String(title || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase() || '').join('') || 'CF';
}

export function ProductCard({ product, onAdd, compact = false }: Props) {
  const normalizedProduct = normalizeProduct(product);
  const image = productImageUrl(normalizedProduct);
  const [imageFailed, setImageFailed] = useState(false);
  const fallbackLabel = useMemo(
    () => buildFallbackLabel(normalizedProduct.title),
    [normalizedProduct.title]
  );
  const hasImage = Boolean(image && !imageFailed);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {hasImage ? (
        <Image
          source={{ uri: image as string }}
          style={[styles.image, compact && styles.imageCompact]}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={[styles.image, compact && styles.imageCompact, styles.placeholder]}>
          <View style={styles.placeholderBadge}>
            <Text style={styles.placeholderBadgeText}>{fallbackLabel}</Text>
          </View>
          <Text style={styles.placeholderTitle} numberOfLines={2}>
            {normalizedProduct.title}
          </Text>
          <Text style={styles.placeholderCaption} numberOfLines={1}>
            {normalizedProduct.category?.name || 'Coffich Menu'}
          </Text>
        </View>
      )}

      <View style={[styles.body, compact && styles.bodyCompact]}>
        <View style={[styles.header, compact && styles.headerCompact]}>
          {!!normalizedProduct.category?.name && (
            <Text
              style={[styles.category, compact && styles.categoryCompact]}
              numberOfLines={1}
            >
              {normalizedProduct.category.name}
            </Text>
          )}
          <Text style={[styles.priceCompact, compact && styles.priceCompactSmall]}>
            {formatPriceUZS(normalizedProduct.price)}
          </Text>
        </View>
        <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
          {normalizedProduct.title}
        </Text>
        {!!normalizedProduct.shortDescription && (
          <Text style={[styles.description, compact && styles.descriptionCompact]} numberOfLines={3}>
            {normalizedProduct.shortDescription}
          </Text>
        )}

        <View style={[styles.footer, compact && styles.footerCompact]}>
          {!compact && (
            <Text style={styles.priceHint}>Свежая позиция в меню</Text>
          )}
          <Pressable
            style={[styles.button, compact && styles.buttonCompact]}
            onPress={() => onAdd(normalizedProduct)}
          >
            <Text style={styles.buttonText}>В корзину</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardCompact: {
    width: '48%',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    aspectRatio: 1.15,
  },
  imageCompact: {
    aspectRatio: 0.95,
  },
  placeholder: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 14,
  },
  placeholderBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(125, 67, 29, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderBadgeText: {
    color: colors.accentDark,
    fontSize: 16,
    fontWeight: '800',
  },
  placeholderTitle: {
    color: colors.accentDark,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  placeholderCaption: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    padding: 14,
    gap: 6,
  },
  bodyCompact: {
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerCompact: {
    alignItems: 'center',
    gap: 8,
  },
  category: {
    color: colors.accent,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    flex: 1,
  },
  categoryCompact: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  priceCompact: {
    color: colors.accentDark,
    fontSize: 16,
    fontWeight: '800',
  },
  priceCompactSmall: {
    fontSize: 14,
    flexShrink: 0,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  titleCompact: {
    fontSize: 17,
    lineHeight: 22,
    minHeight: 44,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 40,
  },
  descriptionCompact: {
    fontSize: 13,
    lineHeight: 18,
    minHeight: 56,
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerCompact: {
    marginTop: 'auto',
    paddingTop: 2,
  },
  priceHint: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonCompact: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
