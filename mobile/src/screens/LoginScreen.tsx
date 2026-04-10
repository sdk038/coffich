import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { ApiHttpError } from '../lib/api';
import { colors } from '../theme/colors';

const PHONE_PREFIX = '+998';

function normalizePhone(value: string) {
  const digits = String(value || '').replace(/\D/g, '');
  const suffix = digits.startsWith('998') ? digits.slice(3) : digits;
  return `${PHONE_PREFIX}${suffix}`;
}

export function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, sendCode, fetchTelegramStatus, login } = useAuth();
  const [step, setStep] = useState<'details' | 'code'>('details');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState(PHONE_PREFIX);
  const [code, setCode] = useState('');
  const [requestId, setRequestId] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [botUrl, setBotUrl] = useState('');
  const [devCode, setDevCode] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);

  useEffect(() => {
    if (user) {
      navigation.replace('MainTabs');
    }
  }, [navigation, user]);

  const canRequestCode = useMemo(() => {
    return firstName.trim() && lastName.trim() && phone.replace(/\D/g, '').length === 12;
  }, [firstName, lastName, phone]);

  const requestCode = async () => {
    if (!canRequestCode || pending) return;
    setPending(true);
    try {
      const data: any = await sendCode({
        phone: phone.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setStep('code');
      setRequestId(data?.requestId || '');
      setBotUrl(data?.telegramBotUrl || '');
      setDevCode(data?.devCode || '');
      setCode(data?.devCode || '');
      setCodeSent(Boolean(data?.codeSent));
      setTelegramLinked(Boolean(data?.telegramLinked));
      setMessage(data?.message || 'Код отправлен.');
    } catch (ex: any) {
      const errorMessage = ex?.message || 'Попробуйте ещё раз.';
      const needsLocationSettings =
        ex instanceof ApiHttpError &&
        /геолокац|GPS|локаци/i.test(errorMessage);

      if (needsLocationSettings) {
        Alert.alert('Нужен доступ к геолокации', errorMessage, [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Открыть настройки',
            onPress: () => {
              void Linking.openSettings();
            },
          },
        ]);
      } else {
        Alert.alert('Не удалось начать вход', errorMessage);
      }
    } finally {
      setPending(false);
    }
  };

  const refreshStatus = useCallback(
    async (showPendingState = true) => {
      if (!requestId || devCode) {
        return;
      }
      if (showPendingState) {
        setCheckingStatus(true);
      }
      try {
        const data: any = await fetchTelegramStatus(requestId);
        setMessage(data?.message || 'Статус Telegram обновлён.');
        setBotUrl(data?.telegramBotUrl || botUrl);
        setCodeSent(Boolean(data?.codeSent));
        setTelegramLinked(Boolean(data?.telegramLinked));
      } catch (ex: any) {
        Alert.alert(
          'Не удалось проверить Telegram',
          ex?.message || 'Попробуйте ещё раз.'
        );
      } finally {
        if (showPendingState) {
          setCheckingStatus(false);
        }
      }
    },
    [botUrl, devCode, fetchTelegramStatus, requestId]
  );

  useEffect(() => {
    if (step !== 'code' || !requestId || devCode || codeSent) {
      return undefined;
    }
    refreshStatus(false);
    const timerId = setInterval(() => {
      refreshStatus(false);
    }, 4000);
    return () => {
      clearInterval(timerId);
    };
  }, [codeSent, devCode, refreshStatus, requestId, step]);

  const submitCode = async () => {
    if (code.trim().length !== 4 || pending || !codeSent) return;
    setPending(true);
    try {
      await login(phone.trim(), code.trim());
      navigation.replace('MainTabs');
    } catch (ex: any) {
      const messageText =
        ex instanceof ApiHttpError ? ex.message : 'Не удалось подтвердить вход.';
      Alert.alert('Ошибка входа', messageText);
    } finally {
      setPending(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 12) + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topCopy}>
            <Text style={styles.eyebrow}>Аккаунт</Text>
            <Text style={styles.heroTitle}>Вход в Coffich</Text>
            <Text style={styles.heroLead}>
              Быстрый вход по номеру телефона, чтобы оформлять заказы и смотреть историю покупок.
            </Text>
          </View>

          <View style={styles.stepsRow}>
            <View style={[styles.stepPill, step === 'details' && styles.stepPillActive]}>
              <Text style={[styles.stepPillText, step === 'details' && styles.stepPillTextActive]}>
                1. Данные
              </Text>
            </View>
            <View style={[styles.stepPill, step === 'code' && styles.stepPillActive]}>
              <Text style={[styles.stepPillText, step === 'code' && styles.stepPillTextActive]}>
                2. Код
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{step === 'details' ? 'Ваши данные' : 'Подтверждение входа'}</Text>
            {step === 'details' ? (
              <>
                <Text style={styles.lead}>
                  Укажите имя, фамилию и номер телефона. Дальше мы отправим код для входа.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Имя"
                  placeholderTextColor={colors.textMuted}
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Фамилия"
                  placeholderTextColor={colors.textMuted}
                  value={lastName}
                  onChangeText={setLastName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="+998"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(value) => setPhone(normalizePhone(value))}
                />
                <Pressable
                  style={[styles.primaryButton, (!canRequestCode || pending) && styles.disabled]}
                  onPress={requestCode}
                >
                  <Text style={styles.primaryButtonText}>
                    {pending ? 'Запрашиваем...' : 'Получить код'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.lead}>
                  {message || 'Введите код из Telegram или dev-код для локальной разработки.'}
                </Text>
                {!devCode && (
                  <View
                    style={[
                      styles.statusBox,
                      codeSent && styles.statusBoxReady,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        codeSent && styles.statusTextReady,
                      ]}
                    >
                      {codeSent
                        ? 'Telegram подключен, код уже отправлен.'
                        : telegramLinked
                          ? 'Telegram подключен. Отправляем код...'
                          : 'Нажмите Start в Telegram, затем вернитесь сюда.'}
                    </Text>
                  </View>
                )}
                {!!botUrl && (
                  <Pressable style={styles.secondaryButton} onPress={() => Linking.openURL(botUrl)}>
                    <Text style={styles.secondaryButtonText}>Открыть Telegram</Text>
                  </Pressable>
                )}
                {!devCode && (
                  <Pressable
                    style={[styles.secondaryButton, checkingStatus && styles.disabled]}
                    onPress={() => refreshStatus(true)}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {checkingStatus ? 'Проверяем Telegram...' : 'Я нажал Start, проверить'}
                    </Text>
                  </Pressable>
                )}
                {!!requestId && (
                  <View style={styles.metaBox}>
                    <Text style={styles.meta}>Сессия входа: {requestId}</Text>
                  </View>
                )}
                {!!devCode && (
                  <View style={styles.metaBox}>
                    <Text style={styles.meta}>Dev-код: {devCode}</Text>
                  </View>
                )}
                <TextInput
                  style={styles.input}
                  placeholder="Код из 4 цифр"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={code}
                  onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 4))}
                />
                <Pressable
                  style={[
                    styles.primaryButton,
                    (code.trim().length !== 4 || pending || !codeSent) && styles.disabled,
                  ]}
                  onPress={submitCode}
                >
                  <Text style={styles.primaryButtonText}>
                    {pending ? 'Проверяем...' : 'Войти'}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.backButton}
                  onPress={() => {
                    setStep('details');
                    setCode('');
                    setCodeSent(false);
                    setTelegramLinked(false);
                    setDevCode('');
                    setRequestId('');
                    setBotUrl('');
                    setMessage('');
                  }}
                >
                  <Text style={styles.backText}>Изменить данные</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  topCopy: {
    marginBottom: 16,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroLead: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  stepPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepPillActive: {
    backgroundColor: colors.accentDark,
    borderColor: colors.accentDark,
  },
  stepPillText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  stepPillTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
  },
  lead: {
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 14,
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: colors.accentDark,
    fontWeight: '700',
  },
  statusBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  statusBoxReady: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBg,
  },
  statusText: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  statusTextReady: {
    color: colors.successText,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  meta: {
    color: colors.accentDark,
    fontSize: 13,
  },
  metaBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
});
