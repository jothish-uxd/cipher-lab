import { Link, NavLink } from 'react-router-dom';
import Logo from './Logo';
import { CURRENT_USER } from '../data/customers';

export default function AppHeader() {
  return (
    <header className="app-header">
      <Link to="/overview" className="app-header__brand" aria-label="Cipher Lab, go to overview">
        <Logo />
      </Link>
      <nav className="app-header__tabs" aria-label="Primary">
        <NavLink to="/overview" className="top-tab">Overview</NavLink>
        <NavLink to="/studio" className="top-tab">Studio</NavLink>
      </nav>
      <div className="app-header__user">
        <span className="avatar" aria-hidden="true">{CURRENT_USER.initials}</span>
        <span className="app-header__user-text">
          <span className="app-header__user-name">{CURRENT_USER.name}</span>
          <span className="app-header__user-role">{CURRENT_USER.role}</span>
        </span>
      </div>
    </header>
  );
}
