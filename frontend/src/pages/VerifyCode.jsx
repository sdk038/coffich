import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiHttpError } from '../lib/api';
import './AuthPages.css';

function useVerifyParams(location) {
  return useMemo(() => {
    const search = new URLSearchParams(location.search);
    return {
      phone: search.get('phone') || '',
      devCode: search.get('devCode') || '',
    };
  }, [location.search]);
}

export default function VerifyCode() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const { phone, devCode } = useVerifyParams(location);

  const [code, setCode] = useState(devCode);
  const [err, setErr] = useState(null);
  const [pending, setPending] = useState(false);

  if (!phone) {
    return <Navigate to="/login" replace />;
  }

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      await login(phone.trim(), code.trim());
      navigate(from, { replace: true });
    } catch (ex) {
      setErr(ex instanceof ApiHttpError ? ex.message : 'Не удалось подтвердить вход');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page auth-page">
      <div className="auth-page__inner">
        <h1 className="auth-page__title">Подтверждение</h1>
        <p className="auth-page__lead">
          Мы отправили код на номер <strong>{phone}</strong>. Введите его ниже, и
          после успешной проверки вы автоматически попадёте на сайт.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
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
          {devCode && <p className="auth-form__info">Тестовый код: {devCode}</p>}

          <button
            type="submit"
            className="auth-form__submit btn btn--primary"
            disabled={pending}
          >
            {pending ? 'Проверка…' : 'Войти на сайт'}
          </button>
        </form>
        <p className="auth-page__footer">
          <Link to="/login">Изменить данные</Link>
        </p>
      </div>
    </div>
  );
}
