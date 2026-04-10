import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { StateCard } from '../components/StateCard';
import { useAuth } from '../contexts/AuthContext';
import { normalizeOrder } from '../lib/normalize';
import { colors } from '../theme/colors';
import { formatPriceUZS } from '../lib/format';

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  inProgress: 'В работе',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

export function OrderHistoryScreen({ navigation }: any) {
  const { authorizedRequest, user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: any = await authorizedRequest('/api/orders/');
      setOrders(Array.isArray(data) ? data.map(normalizeOrder) : []);
    } catch (ex: any) {
      setError(ex?.message || 'Не удалось загрузить историю заказов.');
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest]);

  useEffect(() => {
    if (!authLoading && user) {
      void loadOrders();
    }
    if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, loadOrders, user]);

  if (authLoading || loading) {
    return (
      <Screen centered scroll={false}>
        <StateCard
          loading
          title="Загружаем историю"
          description="Проверяем аккаунт и подтягиваем архив заказов."
        />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen centered scroll={false}>
        <StateCard
          title="Нужен вход в аккаунт"
          description="История заказов доступна только после авторизации."
          actionLabel="Войти"
          onActionPress={() => navigation.navigate('Login')}
        />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen centered scroll={false}>
        <StateCard
          title="История заказов недоступна"
          description={error}
          actionLabel="Повторить"
          onActionPress={() => {
            void loadOrders();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionHeader
        eyebrow="Архив"
        title="История заказов"
        description={
          orders.length > 0
            ? `У вас ${orders.length} ${orders.length === 1 ? 'заказ' : 'заказов'} в архиве.`
            : 'Здесь будут отображаться все оформленные заказы.'
        }
      />
      {orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Заказов пока нет</Text>
          <Text style={styles.emptyText}>Как только вы оформите первый заказ, он появится на этой странице.</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={String(order.id)} style={styles.card}>
            <View style={styles.head}>
              <View>
                <Text style={styles.orderTitle}>Заказ #{order.id}</Text>
                <Text style={styles.date}>
                  {order.createdAt || order.created_at
                    ? new Date(order.createdAt || order.created_at).toLocaleString('ru-RU')
                    : 'Дата неизвестна'}
                </Text>
              </View>
              <Text style={styles.status}>{STATUS_LABELS[order.status] || order.status}</Text>
            </View>
            <View style={styles.itemsBox}>
              {(order.items || []).map((item: any) => (
                <View key={String(item.id)} style={styles.itemRow}>
                  <Text style={styles.itemText}>{item.title}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} x {formatPriceUZS(item.price)}
                  </Text>
                </View>
              ))}
            </View>
            {!!order.note && <Text style={styles.note}>Комментарий: {order.note}</Text>}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Сумма</Text>
              <Text style={styles.total}>{formatPriceUZS(order.totalSum || order.total_sum || 0)}</Text>
            </View>
          </View>
        ))
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
  error: {
    color: colors.dangerText,
    textAlign: 'center',
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
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  orderTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  date: {
    color: colors.textMuted,
    marginTop: 4,
  },
  status: {
    color: colors.accentDark,
    fontWeight: '700',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  itemsBox: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  itemText: {
    color: colors.text,
    flex: 1,
  },
  itemMeta: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  note: {
    color: colors.textMuted,
    marginTop: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  total: {
    color: colors.accentDark,
    fontSize: 20,
    fontWeight: '800',
  },
});
