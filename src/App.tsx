import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import OverviewPage from './pages/OverviewPage';
import StudioLayout from './pages/StudioLayout';
import CustomersPage from './pages/CustomersPage';
import CompanyPage from './pages/CompanyPage';
import SolutionPage from './pages/SolutionPage';
import NotFound from './pages/NotFound';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setMenuOpen(false), [pathname]); // close the small-screen menu after navigating

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <AppHeader menuOpen={menuOpen} onMenu={() => setMenuOpen((o) => !o)} />
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/studio" element={<StudioLayout menuOpen={menuOpen} />}>
          <Route index element={<CustomersPage />} />
          <Route path=":customerId" element={<CompanyPage />} />
          <Route path=":customerId/solutions/:solutionId" element={<SolutionPage />} />
          <Route path=":customerId/solutions/:solutionId/:stageId" element={<SolutionPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
