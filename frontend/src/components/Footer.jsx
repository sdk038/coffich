import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import './Footer.css';

export default function Footer() {
  const { shop } = useShop();
  const tag =
    shop?.tagline || 'Свежая обжарка и домашняя выпечка.';

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__logo">
            ☕ {shop?.shopName || 'Coffich'}
          </span>
          <p className="footer__tag">{tag}</p>
        </div>
        <div className="footer__links">
          <Link to="/menu">Меню</Link>
          <Link to="/about">О нас</Link>
          <Link to="/contact">Контакты</Link>
        </div>
        <p className="footer__copy">© {new Date().getFullYear()} Coffich</p>
      </div>
    </footer>
  );
}
