import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import './Footer.css';

export default function Footer() {
  const { shop } = useShop();
  const tag = shop?.tagline || 'Кофе, десерты и тёплая пауза в ритме города.';

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
        <div className="footer__meta">
          {shop?.address && <p>{shop.address}</p>}
          {shop?.hours && <p>{shop.hours}</p>}
        </div>
        <p className="footer__copy">© {new Date().getFullYear()} Coffich</p>
      </div>
    </footer>
  );
}
