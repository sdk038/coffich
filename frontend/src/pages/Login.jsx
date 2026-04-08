import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiHttpError } from '../lib/api';
import './AuthPages.css';

function useInitialPhone(location) {
  return useMemo(() => {
    const search = new URLSearchParams(location.search);
    return search.get('phone') || '';
  }, [location.search]);
}

export default function Login() {
  const { user, loading, sendCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const initialPhone = useInitialPhone(location);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState(initialPhone);
  const [err, setErr] = useState(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Локация не определена');
  const [locationReady, setLocationReady] = useState(false);

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
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__field">
            <span className="auth-form__label">Имя</span>
            <input
              type="text"
              className="auth-form__input"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
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
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder='Введите свою фамилию'
            />
          </label>
          <label className="auth-form__field">
            <span className="auth-form__label">Телефон</span>
            <input
              type="tel"
              className="auth-form__input"
              autoComplete="tel"
              placeholder="+998 ... .. .."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <div className={`auth-page__status${locationReady ? ' auth-page__status--ready' : ''}`}>
            {locationLabel}
          </div>
          <br/>
          <button
            type="submit"
            className="btn btn--ghost auth-page__secondary"
            disabled={
              sendingCode ||
              !firstName.trim() ||
              !lastName.trim() ||
              !phone.trim()
            }
          >
            {sendingCode ? 'Переход в Telegram…' : 'Войти'}
          </button>

          {err && <p className="auth-form__error">{err}</p>}
        </form>
      </div>
    </div>
  );
}
