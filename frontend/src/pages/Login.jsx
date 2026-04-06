import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const { login, sendCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const initialPhone = useInitialPhone(location);

  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [err, setErr] = useState(null);
  const [info, setInfo] = useState(null);
  const [pending, setPending] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  async function handleSendCode() {
    setErr(null);
    setInfo(null);
    setSendingCode(true);
    try {
      await sendCode(phone.trim());
      setInfo('Код отправлен. Проверьте SMS.');
    } catch (ex) {
      setErr(ex instanceof ApiHttpError ? ex.message : 'Не удалось отправить код');
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setPending(true);
    try {
      await login(phone.trim(), code.trim());
      navigate(from, { replace: true });
    } catch (ex) {
      setErr(ex instanceof ApiHttpError ? ex.message : 'Не удалось войти');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page auth-page">
      <div className="auth-page__inner">
        <h1 className="auth-page__title">Вход</h1>
        <p className="auth-page__lead">
          Введите номер телефона и 4-значный код из SMS.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
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
            type="button"
            className="btn btn--ghost auth-page__secondary"
            onClick={handleSendCode}
            disabled={sendingCode || !phone.trim()}
          >
            {sendingCode ? 'Отправка кода…' : 'Отправить код'}
          </button>

          <label className="auth-form__field">
            <span className="auth-form__label">Код из SMS</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              className="auth-form__input"
              placeholder="1234"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </label>

          {err && <p className="auth-form__error">{err}</p>}
          {info && <p className="auth-form__info">{info}</p>}

          <button
            type="submit"
            className="auth-form__submit btn btn--primary"
            disabled={pending}
          >
            {pending ? 'Вход…' : 'Войти'}
          </button>
        </form>
        <p className="auth-page__footer">
          Нет аккаунта? <Link to="/register">Регистрация</Link>
        </p>
      </div>
    </div>
  );
}
