import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { useTheme } from './useTheme';
import { CURRENT_USER } from '../data/customers';

interface Props { menuOpen: boolean; onMenu: () => void }

export default function AppHeader({ menuOpen, onMenu }: Props) {
  const { theme, toggle } = useTheme();
  const inStudio = useLocation().pathname.startsWith('/studio');

  return (
    <header className="site-header">
      {inStudio && (
        <button
          type="button"
          className="icon-button menu-button"
          aria-expanded={menuOpen}
          aria-controls="sidebar"
          onClick={onMenu}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          <span>Menu</span>
        </button>
      )}
      <Link to="/overview" className="wordmark-link" aria-label="Cipher Lab overview"><Logo /></Link>
      <span className="header-sep" aria-hidden="true">/</span>
      <span className="badge">v0.1 preview</span>

      <nav className="header-tabs" aria-label="Primary">
        <NavLink to="/overview" className="header-tab">Overview</NavLink>
        <NavLink to="/studio" className="header-tab">Studio</NavLink>
      </nav>

      <div className="header-actions">
        <button type="button" className="icon-button" aria-pressed={theme === 'dark'} onClick={toggle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" /></svg>
          <span className="visually-hidden">Dark theme</span>
        </button>
        <span className="user" title={`${CURRENT_USER.name}, ${CURRENT_USER.role}`}>
          <span className="avatar" aria-hidden="true">{CURRENT_USER.initials}</span>
          <span className="visually-hidden">Signed in as {CURRENT_USER.name}, {CURRENT_USER.role}</span>
        </span>
      </div>
    </header>
  );
}
