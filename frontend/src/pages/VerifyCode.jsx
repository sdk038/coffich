import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiHttpError } from '../lib/api';
import './AuthPages.css';

function useVerifyParams(location) {
  return useMemo(() => {
    const search = new URLSearchParams(location.search);
    return {
      phone: search.get('phone') || '',
      requestId: search.get('requestId') || '',
      botUrl: search.get('botUrl') || '',
      devCode: search.get('devCode') || '',
    };
  }, [location.search]);
}

export default function VerifyCode() {
  const { user, loading, login, fetchTelegramStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const initialStatus = location.state?.telegramStatus || null;
  const { phone, requestId, botUrl: initialBotUrl, devCode } = useVerifyParams(location);

  const [code, setCode] = useState(devCode || '');
  const [info, setInfo] = useState(initialStatus?.message || null);
  const [err, setErr] = useState(null);
  const [pending, setPending] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(
    Boolean(initialStatus?.telegramLinked)
  );
  const [codeSent, setCodeSent] = useState(Boolean(initialStatus?.codeSent));
  const [botUrl, setBotUrl] = useState(initialBotUrl || initialStatus?.telegramBotUrl || '');

  const refreshStatus = useCallback(
    async (showPendingState = true) => {
      if (!requestId) {
        return;
      }
      if (showPendingState) {
        setCheckingStatus(true);
      }
      try {
        const data = await fetchTelegramStatus(requestId);
        setInfo(data?.message || null);
        setTelegramLinked(Boolean(data?.telegramLinked));
        setCodeSent(Boolean(data?.codeSent));
        if (data?.telegramBotUrl) {
          setBotUrl(data.telegramBotUrl);
        }
        setErr(null);
      } catch (ex) {
        setErr(ex instanceof ApiHttpError ? ex.message : 'Не удалось проверить Telegram');
      } finally {
        if (showPendingState) {
          setCheckingStatus(false);
        }
      }
    },
    [fetchTelegramStatus, requestId]
  );

  useEffect(() => {
    if (!phone || !requestId || devCode || (!loading && user)) {
      return undefined;
    }
    let timerId;
    refreshStatus(false);
    if (!codeSent) {
      timerId = window.setInterval(() => {
        refreshStatus(false);
      }, 4000);
    }
    return () => {
      if (timerId) {
        window.clearInterval(timerId);
      }
    };
  }, [codeSent, devCode, refreshStatus, loading, phone, requestId, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!codeSent) {
      setErr('Сначала откройте Telegram-бота, нажмите Start и дождитесь кода.');
      return;
    }
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

  if (!phone || !requestId) {
    return <Navigate to="/login" replace />;
  }

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="page auth-page">
      <div className="auth-page__inner">
        <h1 className="auth-page__title">Подтверждение</h1>
        <p className="auth-page__lead">
          {devCode
            ? (
              <>
                Для номера <strong>{phone}</strong> Telegram сейчас недоступен, поэтому
                используйте тестовый код ниже.
              </>
            )
            : (
              <>
                Вход для номера <strong>{phone}</strong> подтверждается через Telegram.
                Откройте бота, нажмите <strong>Start</strong>, затем введите код из сообщения.
              </>
            )}
        </p>
        {!devCode && (
          <div className="auth-page__stack">
            {botUrl && (
              <a
                className="btn btn--ghost auth-page__secondary"
                href={botUrl}
                target="_blank"
                rel="noreferrer"
              >
                Открыть Telegram-бота
              </a>
            )}
            <button
              type="button"
              className="btn btn--ghost auth-page__secondary"
              onClick={() => refreshStatus(true)}
              disabled={checkingStatus}
            >
              {checkingStatus ? 'Проверяем Telegram…' : 'Я нажал Start, проверить'}
            </button>
            <div className={`auth-page__status${codeSent ? ' auth-page__status--ready' : ''}`}>
              {codeSent
                ? 'Telegram подключен, код уже отправлен.'
                : telegramLinked
                  ? 'Telegram подключен. Отправляем код…'
                  : 'Ожидаем, когда вы нажмёте Start в Telegram.'}
            </div>
          </div>
        )}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__field">
            <span className="auth-form__label">Код из Telegram</span>
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
          {devCode && <p className="auth-form__info">Тестовый код: {devCode}</p>}

          <button
            type="submit"
            className="auth-form__submit btn btn--primary"
            disabled={pending || !codeSent}
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
