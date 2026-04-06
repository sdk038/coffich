import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Header.css';

const links = [
  { to: '/', label: 'Главная' },
  { to: '/menu', label: 'Меню' },
  { to: '/about', label: 'О нас' },
  { to: '/contact', label: 'Контакты' },
];

export default function Header() {
  const { totalCount } = useCart();
  const { user, loading } = useAuth();

  return (
    <header className="header">
      <div className="header__inner">
        <NavLink to="/" className="header__brand">
          <span className="header__logo" aria-hidden>
            ☕
          </span>
          <span className="header__title">Coffich</span>
        </NavLink>
        <nav className="header__nav" aria-label="Основное меню">
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
          {!loading && user && (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `header__link${isActive ? ' header__link--active' : ''}`
              }
            >
              Профиль
            </NavLink>
          )}
          {!loading && !user && (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `header__link${isActive ? ' header__link--active' : ''}`
                }
              >
                Вход
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `header__link${isActive ? ' header__link--active' : ''}`
                }
              >
                Регистрация
              </NavLink>
            </>
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
        </nav>
      </div>
    </header>
  );
}
