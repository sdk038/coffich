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

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    setSendingCode(true);
    try {
      const data = await sendCode({
        phone: phone.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      const params = new URLSearchParams({ phone: phone.trim() });
      if (data?.devCode) params.set('devCode', String(data.devCode));
      navigate(`/verify?${params.toString()}`, {
        replace: true,
        state: { from },
      });
    } catch (ex) {
      setErr(ex instanceof ApiHttpError ? ex.message : 'Не удалось отправить код');
    } finally {
      setSendingCode(false);
    }
  }

  return (
    <div className="page auth-page">
      <div className="auth-page__inner">
        <h1 className="auth-page__title">Вход</h1>
        <p className="auth-page__lead">
          Укажите имя, фамилию и номер телефона. После нажатия кнопки откроется
          отдельная страница для ввода кода из SMS.
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
            />
          </label>
          <label className="auth-form__field">
            <span className="auth-form__label">Телефон</span>
            <input
              type="tel"
              className="auth-form__input"
              autoComplete="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
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
            {sendingCode ? 'Отправка кода…' : 'Отправить код'}
          </button>

          {err && <p className="auth-form__error">{err}</p>}
        </form>
      </div>
    </div>
  );
}
