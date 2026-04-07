import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Header.css';

const links = [
  { to: '/', label: 'Главная' },
  { to: '/menu', label: 'Меню' },
  { to: '/about', label: 'О нас' },
  { to: '/contact', label: 'Контакты' },
];

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.6 0-6.5 1.8-7.5 4.5A1.1 1.1 0 0 0 5.55 20h12.9a1.1 1.1 0 0 0 1.05-1.5C18.5 15.8 15.6 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Header() {
  const location = useLocation();
  const { totalCount } = useCart();
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const accountLabel = user ? 'Профиль' : 'Аккаунт';
  const accountTarget = user ? '/profile' : '/login';
  const authHint = user
    ? 'Управляйте профилем и быстрее возвращайтесь к заказу.'
    : 'Вход по номеру телефона и 4-значному коду из SMS.';

  return (
    <header className="header">
      <div className="header__inner">
        <NavLink to="/" className="header__brand">
          <span className="header__logo" aria-hidden>
            ☕
          </span>
          <span className="header__title">Coffich</span>
        </NavLink>

        <nav className="header__nav header__nav--desktop" aria-label="Основное меню">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `header__link${isActive ? ' header__link--active' : ''}`
              }
              end={to === '/'}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          {!loading && (
            <NavLink
              to={accountTarget}
              className={({ isActive }) =>
                `header__account${isActive ? ' header__account--active' : ''}`
              }
              aria-label={accountLabel}
            >
              <span className="header__account-icon">
                <UserIcon />
              </span>
              <span className="header__account-label">{accountLabel}</span>
            </NavLink>
          )}
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `header__cart${isActive ? ' header__cart--active' : ''}`
            }
          >
            <span className="header__cart-icon" aria-hidden>
              🛒
            </span>
            <span className="header__cart-label">Корзина</span>
            {totalCount > 0 && (
              <span className="header__cart-badge">{totalCount}</span>
            )}
          </NavLink>

          <button
            type="button"
            className={`header__menu-toggle${menuOpen ? ' header__menu-toggle--open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="header__mobile" id="mobile-menu">
          <button
            type="button"
            className="header__mobile-backdrop"
            aria-label="Закрыть меню"
            onClick={() => setMenuOpen(false)}
          />
          <div className="header__mobile-panel">
            <div className="header__mobile-top">
              <p className="header__mobile-eyebrow">Навигация</p>
              {!loading && (
                <NavLink to={accountTarget} className="header__mobile-account">
                  <span className="header__mobile-account-icon">
                    <UserIcon />
                  </span>
                  <span>
                    <strong>{accountLabel}</strong>
                    <small>{authHint}</small>
                  </span>
                </NavLink>
              )}
            </div>

            <nav className="header__mobile-links" aria-label="Мобильное меню">
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `header__mobile-link${isActive ? ' header__mobile-link--active' : ''}`
                  }
                  end={to === '/'}
                >
                  {label}
                </NavLink>
              ))}
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `header__mobile-link${isActive ? ' header__mobile-link--active' : ''}`
                }
              >
                Корзина
                {totalCount > 0 && (
                  <span className="header__mobile-badge">{totalCount}</span>
                )}
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
