import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function StudioLayout({ menuOpen }: { menuOpen: boolean }) {
  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} />
      <main id="main" className="main">
        <Outlet />
      </main>
    </div>
  );
}
