import { Outlet } from 'react-router-dom';
import VaultSidebar from '../../components/vault/VaultSidebar';
import BrowserFrame, { useFrameHistory } from '../../components/BrowserFrame';
import { CURRENT_USER } from '../../data/vault/org';
import ResetVault from '../../components/vault/ResetVault';

export default function VaultLayout() {
  const { pathname, nav, menuOpen, setMenuOpen } = useFrameHistory();

  return (
    <BrowserFrame.Stage>
      <BrowserFrame
        host="vault.igbc.bank"
        path={pathname.replace(/^\/vault/, '') || '/'}
        nav={nav}
        menu={{ open: menuOpen, onToggle: () => setMenuOpen((o) => !o), controls: 'sidebar' }}
        end={
          <>
          <ResetVault />
          <span title={`${CURRENT_USER.name}, ${CURRENT_USER.role}`}>
            <span className="avatar avatar--sm" aria-hidden="true">{CURRENT_USER.initials}</span>
            <span className="visually-hidden">Signed in as {CURRENT_USER.name}, {CURRENT_USER.role}</span>
          </span>
          </>
        }
      >
        <div className="vault-body">
          <VaultSidebar open={menuOpen} />
          <main id="main" className="vault-main">
            <Outlet />
          </main>
        </div>
      </BrowserFrame>
    </BrowserFrame.Stage>
  );
}
