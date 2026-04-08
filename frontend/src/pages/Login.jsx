import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiHttpError } from '../lib/api';
import './AuthPages.css';

const PHONE_PREFIX = '+998';
const UZBEK_PHONE_DIGITS = 12;

function useInitialPhone(location) {
  return useMemo(() => {
    const search = new URLSearchParams(location.search);
    return search.get('phone') || '';
  }, [location.search]);
}

function normalizePhoneInput(value) {
  const digits = String(value || '').replace(/\D/g, '');
  const suffixDigits = digits.startsWith('998') ? digits.slice(3) : digits;
  return `${PHONE_PREFIX}${suffixDigits}`;
}

export default function Login() {
  const { user, loading, sendCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const initialPhone = useInitialPhone(location);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState(() => normalizePhoneInput(initialPhone || PHONE_PREFIX));
  const [err, setErr] = useState(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Локация не определена');
  const [locationReady, setLocationReady] = useState(false);
  const hasPhoneDigits = phone.length > PHONE_PREFIX.length;
  const isPhoneComplete = phone.replace(/\D/g, '').length === UZBEK_PHONE_DIGITS;

  function requestLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Ваш браузер не поддерживает геолокацию.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = Number(position.coords.latitude);
          const longitude = Number(position.coords.longitude);
          setLocationReady(true);
          setLocationLabel('Локация получена');
          resolve({ latitude, longitude });
        },
        () => {
          setLocationReady(false);
          setLocationLabel('Локация не получена');
          reject(
            new Error(
              'Разрешите доступ к геолокации. Доставка доступна только для пользователей из Бухары.'
            )
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    if (!firstName.trim() && !lastName.trim() && !hasPhoneDigits) {
      setErr('Пожалуйста, заполните все поля.');
      return;
    }
    if (!firstName.trim()) {
      setErr('Пожалуйста, введите имя.');
      return;
    }
    if (!lastName.trim()) {
      setErr('Пожалуйста, введите фамилию.');
      return;
    }
    if (!hasPhoneDigits) {
      setErr('Пожалуйста, введите номер телефона.');
      return;
    }
    if (!isPhoneComplete) {
      setErr('Введите номер телефона полностью после +998.');
      return;
    }
    setSendingCode(true);
    try {
      setLocationLabel('Запрашиваем локацию…');
      const { latitude, longitude } = await requestLocation();
      const data = await sendCode({
        phone: phone.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        latitude,
        longitude,
      });
      const params = new URLSearchParams({
        phone: phone.trim(),
        requestId: data.requestId,
      });
      if (data?.telegramBotUrl) {
        params.set('botUrl', data.telegramBotUrl);
      }
      if (data?.devCode) {
        params.set('devCode', data.devCode);
      }
      navigate(`/verify?${params.toString()}`, {
        replace: true,
        state: { from, telegramStatus: data },
      });
    } catch (ex) {
      setErr(ex instanceof ApiHttpError ? ex.message : 'Не удалось начать вход');
    } finally {
      setSendingCode(false);
    }
  }

  return (
    <div className="page auth-page">
      <div className="auth-page__inner">
        <h1 className="auth-page__title">Вход</h1>
        <p className="auth-page__lead">
          Укажите имя, фамилию и номер телефона. Затем мы попросим геолокацию,
          чтобы убедиться, что доставка доступна в Бухаре, и переведём вас во вход через Telegram.
        </p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {err && <p className="auth-form__error">{err}</p>}
          <label className="auth-form__field">
            <span className="auth-form__label">Имя</span>
            <input
              type="text"
              className="auth-form__input"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (err) setErr(null);
              }}
              placeholder='Введите свое имя'
            />
          </label>
          <label className="auth-form__field">
            <span className="auth-form__label">Фамилия</span>
            <input
              type="text"
              className="auth-form__input"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (err) setErr(null);
              }}
              placeholder='Введите свою фамилию'
            />
          </label>
          <label className="auth-form__field">
            <span className="auth-form__label">Телефон</span>
            <input
              type="tel"
              className="auth-form__input"
              autoComplete="tel"
              inputMode="numeric"
              placeholder="90 123 45 67"
              value={phone}
              onChange={(e) => {
                setPhone(normalizePhoneInput(e.target.value));
                if (err) setErr(null);
              }}
            />
          </label>
          <div className={`auth-page__status${locationReady ? ' auth-page__status--ready' : ''}`}>
            {locationLabel}
          </div>
          <br/>
          <button
            type="submit"
            className="btn btn--ghost auth-page__secondary"
            disabled={sendingCode}
          >
            {sendingCode ? 'Переход в Telegram…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
