import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function Profile() {
  const { user, loading, logout } = useAuth();

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
        <dl className="profile-page__dl">
          <div className="profile-page__row">
            <dt className="profile-page__dt">Имя</dt>
            <dd className="profile-page__dd">{user.firstName || '—'}</dd>
          </div>
          <div className="profile-page__row">
            <dt className="profile-page__dt">Фамилия</dt>
            <dd className="profile-page__dd">{user.lastName || '—'}</dd>
          </div>
          <div className="profile-page__row">
            <dt className="profile-page__dt">Телефон</dt>
            <dd className="profile-page__dd">{user.phone || '—'}</dd>
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
