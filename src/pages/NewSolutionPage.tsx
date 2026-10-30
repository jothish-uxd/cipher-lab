import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RISK_TYPES, findCustomer, solutionsOf } from '../data/customers';
import { createSolution, useStoreVersion } from '../data/contracts';
import { usePageTitle } from '../components/usePageTitle';
import Breadcrumbs from '../components/Breadcrumbs';
import NotFoundInline from './NotFoundInline';

export default function NewSolutionPage() {
  const { customerId } = useParams();
  const c = findCustomer(customerId);
  const h = usePageTitle(c ? `New solution for ${c.name}` : 'Customer not found');
  const navigate = useNavigate();
  useStoreVersion();
  const [riskIndex, setRiskIndex] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  if (!c) return <NotFoundInline headingRef={h} what="customer" />;
  const existing = new Set(solutionsOf(c).map((s) => s.name));
  const risk = riskIndex === null ? null : RISK_TYPES[riskIndex];

  const create = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!risk) return;
    const id = createSolution(c, risk, name || risk.name);
    navigate(`/lab/${c.id}/solutions/${id}/contract`);
  };

  return (
    <div className="page">
      <Breadcrumbs items={[{ label: 'Customers', to: '/lab' }, { label: c.name, to: `/lab/${c.id}` }, { label: 'New solution' }]} />
      <header className="page-head">
        <p className="page-kicker">{c.name}</p>
        <h1 ref={h} tabIndex={-1} className="page-title">New solution</h1>
        <p className="page-lede">A solution is one model for one risk. Pick what it should detect; the contract comes next.</p>
      </header>

      <form className="new-solution" onSubmit={create} noValidate>
        <fieldset className="risk-choices" aria-describedby={touched && !risk ? 'risk-error' : undefined}>
          <legend className="section-title">What should it detect?</legend>
          {touched && !risk && <p id="risk-error" className="field-error" role="alert">Choose a risk to continue.</p>}
          <div className="risk-grid">
            {RISK_TYPES.map((r, i) => (
              <label key={r.name} className={`risk-card${riskIndex === i ? ' is-on' : ''}`}>
                <input
                  type="radio"
                  name="risk"
                  checked={riskIndex === i}
                  onChange={() => { setRiskIndex(i); if (!name || RISK_TYPES.some((x) => x.name === name)) setName(r.name); }}
                />
                <span className="risk-card__name">
                  {r.name}
                  {existing.has(r.name) && <span className="tag">Already has one</span>}
                </span>
                <span className="risk-card__about">{r.about}</span>
                <span className="risk-card__labels">Labels: {r.labels.join(' / ')}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-grid form-grid--2">
          <label className="field">
            <span className="field__label">Solution name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={risk?.name ?? 'Choose a risk first'} />
          </label>
          <div className="field">
            <span className="field__label">Vault</span>
            <p className="field__static">{c.vaultProvider}, {c.region}</p>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary">Create and start the contract</button>
          <Link to={`/lab/${c.id}`} className="btn btn--secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
