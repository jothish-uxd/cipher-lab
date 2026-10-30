import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BrowserFrame, { useFrameHistory } from '../components/BrowserFrame';
import { CURRENT_USER } from '../data/customers';

export default function LabLayout() {
  const { pathname, nav, menuOpen, setMenuOpen, scrollRef } = useFrameHistory();

  return (
    <BrowserFrame.Stage>
      <BrowserFrame
        path={pathname}
        nav={nav}
        menu={{ open: menuOpen, onToggle: () => setMenuOpen((o) => !o), controls: 'sidebar' }}
        end={
          <span title={`${CURRENT_USER.name}, ${CURRENT_USER.role}`}>
            <span className="avatar avatar--sm" aria-hidden="true">{CURRENT_USER.initials}</span>
            <span className="visually-hidden">Signed in as {CURRENT_USER.name}, {CURRENT_USER.role}</span>
          </span>
        }
      >
        <div className="lab-body">
          <Sidebar open={menuOpen} />
          <main id="main" className="lab-main" ref={scrollRef}>
            <Outlet />
          </main>
        </div>
      </BrowserFrame>
    </BrowserFrame.Stage>
  );
}
