import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { CURRENT_USER } from '../data/customers';

/**
 * The lab runs inside a simple browser frame that fills the viewport.
 * Navigation, scrolling and the small-screen menu all stay inside the frame;
 * its back and forward buttons only move through pages visited in the lab.
 */
export default function LabLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Frame-local history, so Back never leaves the lab.
  const [hist, setHist] = useState({ entries: [pathname], index: 0 });
  const travelling = useRef(false);
  useEffect(() => {
    setMenuOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
    if (travelling.current) { travelling.current = false; return; }
    setHist((h) => {
      if (h.entries[h.index] === pathname) return h;
      const entries = [...h.entries.slice(0, h.index + 1), pathname];
      return { entries, index: entries.length - 1 };
    });
  }, [pathname]);

  const go = (delta: -1 | 1) => {
    const index = hist.index + delta;
    if (index < 0 || index >= hist.entries.length) return;
    travelling.current = true;
    setHist({ ...hist, index });
    navigate(hist.entries[index]);
  };
  const canBack = hist.index > 0;
  const canForward = hist.index < hist.entries.length - 1;

  return (
    <div className="lab-stage">
      <div className="frame">
        <div className="frame__bar">
          <span className="frame__dots" aria-hidden="true"><span /><span /><span /></span>
          <div className="frame__nav">
            <button type="button" className="frame__btn" onClick={() => go(-1)} disabled={!canBack} aria-label="Back">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
            </button>
            <button type="button" className="frame__btn" onClick={() => go(1)} disabled={!canForward} aria-label="Forward">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
            </button>
            <button
              type="button"
              className="frame__btn frame__menu"
              aria-expanded={menuOpen}
              aria-controls="sidebar"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" /></svg>
              <span className="visually-hidden">Menu</span>
            </button>
          </div>
          <div className="frame__address" aria-label="Current address">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" /><path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" /></svg>
            <span className="frame__host">cipherlab.app</span>
            <span className="frame__path">{pathname}</span>
          </div>
          <span className="frame__user" title={`${CURRENT_USER.name}, ${CURRENT_USER.role}`}>
            <span className="avatar avatar--sm" aria-hidden="true">{CURRENT_USER.initials}</span>
            <span className="visually-hidden">Signed in as {CURRENT_USER.name}, {CURRENT_USER.role}</span>
          </span>
        </div>

        <div className="frame__body">
          <Sidebar open={menuOpen} />
          <main id="main" className="frame__main" ref={mainRef}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
