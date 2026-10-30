import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function StudioLayout() {
  return (
    <div className="studio">
      <Sidebar />
      <main id="main" className="studio__main">
        <Outlet />
      </main>
    </div>
  );
}
