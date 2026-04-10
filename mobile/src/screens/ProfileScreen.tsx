import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { StateCard } from '../components/StateCard';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

export function ProfileScreen({ navigation }: any) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <Screen centered scroll={false}>
        <StateCard
          loading
          title="Загружаем профиль"
          description="Проверяем сохранённую сессию и данные аккаунта."
        />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <SectionHeader
          eyebrow="Аккаунт"
          title="Профиль"
          description="Войдите в аккаунт, чтобы оформлять заказы, сохранять сессию и смотреть историю покупок."
        />
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Что откроется после входа</Text>
          <View style={styles.featureRow}>
            <Text style={styles.featureBullet}>Заказы без повторного входа</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureBullet}>История прошлых заказов</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureBullet}>Быстрое оформление из корзины</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.primaryButtonText}>Войти</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionHeader
        eyebrow="Аккаунт"
        title={`Здравствуйте, ${user.firstName || user.first_name || 'гость'}`}
        description="Проверьте данные профиля, перейдите к истории заказов или выйдите из аккаунта."
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Данные профиля</Text>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Имя</Text>
          <Text style={styles.value}>{user.firstName || user.first_name || '—'}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Фамилия</Text>
          <Text style={styles.value}>{user.lastName || user.last_name || '—'}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Телефон</Text>
          <Text style={styles.value}>{user.phone || '—'}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Локация</Text>
          <Text style={styles.value}>
            {user.latitude != null && user.longitude != null
              ? `${Number(user.latitude).toFixed(5)}, ${Number(user.longitude).toFixed(5)}`
              : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.cardTitle}>Быстрые действия</Text>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('OrderHistory')}>
          <Text style={styles.secondaryButtonText}>История заказов</Text>
        </Pressable>
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Выйти</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  muted: {
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 18,
  },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 14,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  featureRow: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  featureBullet: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dataRow: {
    marginBottom: 14,
  },
  label: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: colors.accentDark,
    fontWeight: '800',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
});
