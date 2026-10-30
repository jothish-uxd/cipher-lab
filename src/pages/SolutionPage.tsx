import { NavLink, useParams } from 'react-router-dom';
import { findCustomer, findSolution } from '../data/customers';
import { STAGES, stageIndex, type StageId } from '../data/stages';
import { usePageTitle } from '../components/usePageTitle';
import Breadcrumbs from '../components/Breadcrumbs';
import NotFoundInline from './NotFoundInline';

type Status = 'Complete' | 'In progress' | 'Not started';

export default function SolutionPage() {
  const { customerId, solutionId, stageId } = useParams();
  const c = findCustomer(customerId);
  const s = findSolution(c, solutionId);
  const viewing = STAGES.find((x) => x.id === stageId) ?? (s ? STAGES[stageIndex(s.stage)] : STAGES[0]);
  const h = usePageTitle(s ? `${viewing.name}: ${s.name}` : 'Solution not found');

  if (!c || !s) return <NotFoundInline headingRef={h} what="solution" />;

  const current = stageIndex(s.stage);
  const statusOf = (id: StageId): Status => {
    const i = stageIndex(id);
    return i < current ? 'Complete' : i === current ? 'In progress' : 'Not started';
  };
  const base = `/lab/${c.id}/solutions/${s.id}`;
  const viewingStatus = statusOf(viewing.id);

  return (
    <div className="page">
      <Breadcrumbs
        items={[
          { label: 'Customers', to: '/lab' },
          { label: c.name, to: `/lab/${c.id}` },
          { label: s.name },
        ]}
      />
      <header className="page-head">
        <p className="page-kicker">{s.name}</p>
        <h1 ref={h} tabIndex={-1} className="page-title">{viewing.name}</h1>
      </header>

      <nav className="stage-nav" aria-label="Solution stages">
        <ol>
          {STAGES.map((st, i) => {
            const status = statusOf(st.id);
            const isViewing = st.id === viewing.id;
            return (
              <li key={st.id}>
                <NavLink
                  to={`${base}/${st.id}`}
                  className={`stage-nav__link is-${status.toLowerCase().replace(' ', '-')}${isViewing ? ' is-viewing' : ''}`}
                  aria-current={isViewing ? 'page' : undefined}
                >
                  <span className="stage-nav__num" aria-hidden="true">
                    {status === 'Complete' ? (
                      <svg viewBox="0 0 16 16" focusable="false"><path d="m4 8.5 2.6 2.5L12 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="stage-nav__name">{st.name}</span>
                  <span className="visually-hidden">, {status}</span>
                </NavLink>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="solution-grid">
        <section className="panel stage-placeholder" aria-labelledby="stage-h">
          <div className="panel__head">
            <h2 id="stage-h" className="section-title">{viewing.name}</h2>
            <span className={`status status--${viewingStatus.toLowerCase().replace(' ', '-')}`}>{viewingStatus}</span>
          </div>
          <p className="stage-placeholder__summary">{viewing.summary}</p>
          {viewing.zone !== 'outside' && (
            <p className="boundary-note">
              {viewing.zone === 'crossing'
                ? 'Runs inside the vault. Only aggregate metrics leave it.'
                : 'Runs inside the customer’s vault. Message content never leaves it.'}
            </p>
          )}
          <p className="muted stage-placeholder__todo">This screen is next in the rebuild.</p>
        </section>

        <aside className="panel solution-facts" aria-labelledby="facts-h">
          <h2 id="facts-h" className="section-title">Solution</h2>
          <dl className="facts facts--stacked">
            <div><dt>Type</dt><dd>{s.type}</dd></div>
            <div><dt>Labels</dt><dd>{s.labels.join(' / ')}</dd></div>
            <div><dt>Function</dt><dd>{s.function}</dd></div>
            <div><dt>Vault</dt><dd>{s.vault}</dd></div>
            <div><dt>Training set</dt><dd>{s.trainingSetId ? <code className="id">{s.trainingSetId}</code> : 'None yet'}</dd></div>
          </dl>
          <h3 className="facts-sub">Team</h3>
          <ul className="team">
            {s.team.map((p) => (
              <li key={p.name}>
                <span className="avatar avatar--sm" aria-hidden="true">{p.name.split(' ').map((w) => w[0]).join('')}</span>
                <span>
                  <span className="team__name">{p.name}</span>
                  <span className="team__role">{p.role}, access level {p.access}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
