import { Navigate, Route, Routes } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import PatternDefs from './components/charts/PatternDefs';
import OverviewPage from './pages/OverviewPage';
import LabLayout from './pages/LabLayout';
import CustomersPage from './pages/CustomersPage';
import CompanyPage from './pages/CompanyPage';
import SolutionPage from './pages/SolutionPage';
import NewSolutionPage from './pages/NewSolutionPage';
import NotFound from './pages/NotFound';
import VaultLayout from './pages/vault/VaultLayout';
import MessagesPage from './pages/vault/MessagesPage';
import VaultPoliciesPage from './pages/vault/PoliciesPage';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <PatternDefs />
      <AppHeader />
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/lab" element={<LabLayout />}>
          <Route index element={<CustomersPage />} />
          <Route path=":customerId" element={<CompanyPage />} />
          <Route path=":customerId/solutions/new" element={<NewSolutionPage />} />
          <Route path=":customerId/solutions/:solutionId" element={<SolutionPage />} />
          <Route path=":customerId/solutions/:solutionId/:stageId" element={<SolutionPage />} />
        </Route>
        <Route path="/vault" element={<VaultLayout />}>
          <Route index element={<Navigate to="/vault/all" replace />} />
          <Route path="policies" element={<VaultPoliciesPage />} />
          <Route path=":viewId" element={<MessagesPage />} />
          <Route path=":viewId/:messageId" element={<MessagesPage />} />
        </Route>
        <Route path="/studio/*" element={<Navigate to="/lab" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
