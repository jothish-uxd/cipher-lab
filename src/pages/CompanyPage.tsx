import { Link, useParams } from 'react-router-dom';
import { findCustomer, solutionsOf } from '../data/customers';
import { currentStage, useStoreVersion } from '../data/contracts';
import { currentTrainingSet } from '../data/fulfillment';
import { hasDeployment, isLive, setLive } from '../data/deployment';
import { usePageTitle } from '../components/usePageTitle';
import Breadcrumbs from '../components/Breadcrumbs';
import StageProgress from '../components/StageProgress';
import Toggle from '../components/Toggle';
import NotFoundInline from './NotFoundInline';
import { ORG as VAULT_ORG } from '../data/vault/lab';

export default function CompanyPage() {
  const { customerId } = useParams();
  const c = findCustomer(customerId);
  const h = usePageTitle(c?.name ?? 'Customer not found');
  useStoreVersion(); // re-render when a stage changes in the lab

  if (!c) return <NotFoundInline headingRef={h} what="customer" />;

  return (
    <div className="page">
      <Breadcrumbs items={[{ label: 'Customers', to: '/lab' }, { label: c.name }]} />
      <header className="page-head">
        <h1 ref={h} tabIndex={-1} className="page-title">{c.name}</h1>
        <dl className="facts">
          <div><dt>Sector</dt><dd>{c.sector}</dd></div>
          <div><dt>Vault region</dt><dd>{c.region}</dd></div>
          <div><dt>Vault provider</dt><dd>{c.vaultProvider}</dd></div>
        </dl>
        {c.id === VAULT_ORG.id && (
          <p className="page-sub">Its compliance team reviews what these models flag in <Link to="/vault/all">the vault</Link>.</p>
        )}
      </header>

      <section aria-labelledby="solutions-h" className="section">
        <div className="section-head">
          <h2 id="solutions-h" className="section-title">Solutions</h2>
          <Link to={`/lab/${c.id}/solutions/new`} className="btn btn--secondary">New solution</Link>
        </div>

        {solutionsOf(c).length === 0 ? (
          <div className="empty">
            <p className="empty__title">No solutions yet</p>
            <p>A solution starts with contract capture: agree what the model should detect, which vault it may read, and the success criteria it has to meet.</p>
            <p><Link to={`/lab/${c.id}/solutions/new`} className="btn btn--primary">Start a new solution</Link></p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="visually-hidden">Solutions for {c.name}</caption>
              <thead>
                <tr>
                  <th scope="col">Solution</th>
                  <th scope="col">Labels</th>
                  <th scope="col">Training set</th>
                  <th scope="col">Stage</th>
                  <th scope="col">In surveillance</th>
                </tr>
              </thead>
              <tbody>
                {solutionsOf(c).map((s) => (
                  <tr key={s.id}>
                    <th scope="row">
                      <Link to={`/lab/${c.id}/solutions/${s.id}`} className="row-link">{s.name}</Link>
                    </th>
                    <td>{s.labels.join(' / ')}</td>
                    <td>{currentTrainingSet(c, s) ? <code className="id">{currentTrainingSet(c, s)}</code> : <span className="muted">None yet</span>}</td>
                    <td><StageProgress stage={currentStage(c, s)} /></td>
                    <td>
                      {currentStage(c, s) === 'deployment' && hasDeployment(c, s) ? (
                        <Toggle
                          checked={isLive(c, s)}
                          onChange={(v) => setLive(c, s, v)}
                          label={`${s.name} in surveillance`}
                        />
                      ) : (
                        <span className="muted">Not deployed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
