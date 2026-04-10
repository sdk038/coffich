import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const firstName = user?.firstName || user?.first_name || '—';
  const lastName = user?.lastName || user?.last_name || '—';
  const hasLocation = user?.latitude != null && user?.longitude != null;

  if (loading) {
    return (
      <div className="page auth-page">
        <p className="auth-page__lead">Загрузка…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: { pathname: '/profile' } }} />;
  }

  return (
    <div className="page auth-page">
      <div className="auth-page__inner" style={{ maxWidth: 480 }}>
        <h1 className="auth-page__title">Профиль</h1>
        <Link to="/profile/orders" className="profile-page__history-link">
          <span className="profile-page__history-link-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M12 7v5l3 2M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="profile-page__history-link-copy">
            <span className="profile-page__history-link-title">История заказов</span>
            <span className="profile-page__history-link-meta">Открыть отдельную страницу архива</span>
          </span>
          <span className="profile-page__history-link-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M9 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>
        <dl className="profile-page__dl">
          <div className="profile-page__row">
            <dt className="profile-page__dt">Имя</dt>
            <dd className="profile-page__dd">{firstName}</dd>
          </div>
          <div className="profile-page__row">
            <dt className="profile-page__dt">Фамилия</dt>
            <dd className="profile-page__dd">{lastName}</dd>
          </div>
          <div className="profile-page__row">
            <dt className="profile-page__dt">Телефон</dt>
            <dd className="profile-page__dd">{user.phone || '—'}</dd>
          </div>
          <div className="profile-page__row">
            <dt className="profile-page__dt">Локация</dt>
            <dd className="profile-page__dd">
              {hasLocation
                ? `${Number(user.latitude).toFixed(5)}, ${Number(user.longitude).toFixed(5)}`
                : '—'}
            </dd>
          </div>
        </dl>
        <div className="profile-page__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              logout();
            }}
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
