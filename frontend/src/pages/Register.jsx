import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiHttpError } from '../lib/api';
import './AuthPages.css';

export default function Register() {
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    setDevCode('');
    setPending(true);
    try {
      const data = await register({
        phone: phone.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      if (data?.devCode) {
        setDevCode(String(data.devCode));
      }
      setDone(true);
    } catch (ex) {
      setErr(ex instanceof ApiHttpError ? ex.message : 'Не удалось зарегистрироваться');
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="page auth-page">
        <div className="auth-page__inner">
          <h1 className="auth-page__title">Код отправлен</h1>
          <p className="auth-page__lead">
            На номер <strong>{phone.trim()}</strong> отправлен 4-значный код входа.
            Перейдите ко входу, введите код из уведомления и завершите авторизацию.
          </p>
          {devCode && (
            <p className="auth-page__info">Код для входа (mock): <strong>{devCode}</strong></p>
          )}
          <Link
            className="btn btn--primary auth-page__cta"
            to={`/login?phone=${encodeURIComponent(phone.trim())}`}
          >
            Перейти ко входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page auth-page">
      <div className="auth-page__inner">
        <h1 className="auth-page__title">Регистрация</h1>
        <p className="auth-page__lead">
          Укажите имя, фамилию и номер телефона. Мы отправим 4-значный код для входа.
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
          {err && <p className="auth-form__error">{err}</p>}
          <button
            type="submit"
            className="auth-form__submit btn btn--primary"
            disabled={pending}
          >
            {pending ? 'Отправка…' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="auth-page__footer">
          Уже есть аккаунт? <Link to="/login">Вход</Link>
        </p>
      </div>
    </div>
  );
}
