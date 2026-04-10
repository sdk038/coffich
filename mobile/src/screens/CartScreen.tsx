import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { ApiHttpError } from '../lib/api';
import { formatPriceUZS, productImageUrl } from '../lib/format';
import { colors } from '../theme/colors';

export function CartScreen({ navigation }: any) {
  const { user, authorizedRequest } = useAuth();
  const { items, totalCount, totalSum, setQuantity, removeItem, clear } = useCart();
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);

  const openOrderHistory = () => {
    navigation.navigate('OrderHistory');
  };

  const checkout = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    if (items.length === 0 || pending) return;
    setPending(true);
    try {
      const data: any = await authorizedRequest('/api/orders/checkout/', {
        method: 'POST',
        body: {
          items: items.map((line) => ({
            key: line.key,
            title: line.title,
            price: Math.round(line.price),
            quantity: line.quantity,
          })),
          note: note.trim(),
        },
      });
      clear();
      setNote('');
      if (data?.warning) {
        Alert.alert(
          'Заказ сохранён',
          `${data?.message || 'Мы получили заказ.'}\n\nТехническая заметка: ${data.warning}`,
          [
            { text: 'ОК' },
            { text: 'История заказов', onPress: openOrderHistory },
          ]
        );
      } else {
        Alert.alert(
          'Заказ отправлен',
          data?.message || 'Мы скоро свяжемся с вами.',
          [
            { text: 'ОК' },
            { text: 'История заказов', onPress: openOrderHistory },
          ]
        );
      }
    } catch (ex: any) {
      if (ex instanceof ApiHttpError && ex.status === 401) {
        Alert.alert(
          'Нужен повторный вход',
          'Сессия истекла. Войдите снова, чтобы оформить заказ.',
          [{ text: 'Войти', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Не удалось оформить', ex?.message || 'Попробуйте снова.');
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <SectionHeader
            eyebrow="Ваш заказ"
            title="Корзина"
            description={
              items.length > 0
                ? `Сейчас в корзине ${totalCount} шт. на сумму ${formatPriceUZS(totalSum)}.`
                : 'Добавьте напитки и десерты, а затем отправьте заказ в пару касаний.'
            }
          />
        </View>
        {items.length > 0 && (
          <Pressable style={styles.clearButton} onPress={clear}>
            <Text style={styles.clear}>Очистить</Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Корзина пока пуста</Text>
          <Text style={styles.emptyText}>Добавьте что-нибудь вкусное из меню и возвращайтесь к оформлению.</Text>
          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.secondaryButtonText}>Перейти в меню</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.summaryStrip}>
            <View style={styles.summaryStripItem}>
              <Text style={styles.summaryStripValue}>{totalCount}</Text>
              <Text style={styles.summaryStripLabel}>товаров</Text>
            </View>
            <View style={styles.summaryStripItem}>
              <Text style={styles.summaryStripValue}>{formatPriceUZS(totalSum)}</Text>
              <Text style={styles.summaryStripLabel}>к оплате</Text>
            </View>
          </View>

          {items.map((item) => (
            <View key={item.key} style={styles.line}>
              <View style={styles.lineTop}>
                <Image
                  source={{
                    uri:
                      item.imageUrl ||
                      productImageUrl({
                        title: item.title,
                        category: { name: item.categoryName || '', slug: 'other' },
                      }),
                  }}
                  style={styles.lineImage}
                />
                <View style={styles.lineInfo}>
                  {!!item.categoryName && (
                    <Text style={styles.lineCategory} numberOfLines={1}>
                      {item.categoryName}
                    </Text>
                  )}
                  <Text style={styles.lineTitle}>{item.title}</Text>
                  <Text style={styles.lineUnit}>{formatPriceUZS(item.price)} за шт.</Text>
                </View>
              </View>
              <View style={styles.lineBottom}>
                <View style={styles.qtyRow}>
                  <Pressable style={styles.qtyButton} onPress={() => setQuantity(item.key, item.quantity - 1)}>
                    <Text style={styles.qtyButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <Pressable style={styles.qtyButton} onPress={() => setQuantity(item.key, item.quantity + 1)}>
                    <Text style={styles.qtyButtonText}>+</Text>
                  </Pressable>
                </View>
                <View style={styles.lineActions}>
                  <Text style={styles.lineSum}>{formatPriceUZS(item.price * item.quantity)}</Text>
                  <Pressable onPress={() => removeItem(item.key)}>
                    <Text style={styles.remove}>Удалить</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Итого ({totalCount} шт.)</Text>
              <Text style={styles.summaryValue}>{formatPriceUZS(totalSum)}</Text>
            </View>
            <Text style={styles.noteLabel}>Комментарий к заказу</Text>
            <TextInput
              style={styles.noteInput}
              multiline
              numberOfLines={4}
              placeholder="Например: без сахара или позвонить перед доставкой"
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
            />
            {!user && (
              <View style={styles.authBox}>
                <Text style={styles.authNote}>
                  Для оформления заказа нужно войти в аккаунт.
                </Text>
              </View>
            )}
            <Pressable
              style={[styles.checkoutButton, (!user || pending) && styles.checkoutDisabled]}
              onPress={checkout}
            >
              <Text style={styles.checkoutText}>
                {pending ? 'Отправляем заказ...' : user ? 'Оформить заказ' : 'Войти и оформить'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  headerMain: {
    flex: 1,
  },
  clearButton: {
    flexShrink: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  clear: {
    color: colors.accentDark,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 16,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.accentDark,
    fontWeight: '800',
  },
  summaryStrip: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryStripItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryStripValue: {
    color: colors.accentDark,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryStripLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  line: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
  },
  lineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  lineImage: {
    width: 104,
    height: 104,
    borderRadius: 18,
  },
  lineInfo: {
    flex: 1,
  },
  lineCategory: {
    color: colors.accent,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: '700',
    marginBottom: 4,
  },
  lineTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  lineUnit: {
    color: colors.textMuted,
    marginTop: 4,
  },
  lineSide: {
    gap: 10,
  },
  lineBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lineActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  qtyButtonText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  lineSum: {
    color: colors.accentDark,
    fontSize: 20,
    fontWeight: '800',
  },
  remove: {
    color: colors.dangerText,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 16,
  },
  summaryValue: {
    color: colors.accentDark,
    fontSize: 24,
    fontWeight: '800',
  },
  noteLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 108,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
    color: colors.text,
  },
  authNote: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  authBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    padding: 12,
  },
  checkoutButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  checkoutDisabled: {
    opacity: 0.7,
  },
  checkoutText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
