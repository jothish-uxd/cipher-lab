import { useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { CUSTOMERS, findCustomer } from '../data/customers';

/** Service view: every customer. Inside a customer: its solutions and models. */
export default function Sidebar({ open }: { open: boolean }) {
  const { customerId } = useParams();
  const customer = findCustomer(customerId);
  return (
    <nav
      id="sidebar"
      className={`sidebar${open ? ' is-open' : ''}`}
      aria-label={customer ? `${customer.name}` : 'Customers'}
    >
      {customer ? <CustomerNav customerId={customer.id} /> : <CustomerList />}
      <p className="sidebar-credit">Placeholder data from the Star Wars galaxy.</p>
    </nav>
  );
}

function CustomerList() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const list = CUSTOMERS.filter((c) => !q || c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q));
  return (
    <div className="nav-group">
      <h2 className="nav-heading" id="nav-customers">
        <BuildingIcon /> Customers
      </h2>
      <label className="filter">
        <span className="visually-hidden">Filter customers</span>
        <input type="search" placeholder="Filter" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <ul className="nav-list" aria-labelledby="nav-customers">
        {list.map((c) => (
          <li key={c.id}>
            <NavLink to={`/studio/${c.id}`} className="nav-link">{c.name}</NavLink>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="nav-empty" role="status">No customers match “{query}”.</p>}
    </div>
  );
}

function CustomerNav({ customerId }: { customerId: string }) {
  const c = findCustomer(customerId)!;
  return (
    <>
      <div className="nav-group">
        <Link to="/studio" className="back-link">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          All customers
        </Link>
        <ul className="nav-list">
          <li><NavLink to={`/studio/${c.id}`} end className="nav-link nav-link--strong">{c.name}</NavLink></li>
        </ul>
      </div>

      <div className="nav-group">
        <h2 className="nav-heading" id="nav-solutions"><LayersIcon /> Solutions</h2>
        <ul className="nav-list nav-list--indented" aria-labelledby="nav-solutions">
          {c.solutions.map((s) => (
            <li key={s.id}>
              <NavLink to={`/studio/${c.id}/solutions/${s.id}`} className="nav-link">{s.name}</NavLink>
            </li>
          ))}
        </ul>
        {c.solutions.length === 0 && <p className="nav-empty">No solutions yet.</p>}
      </div>

      <div className="nav-group">
        <h2 className="nav-heading" id="nav-models"><CubeIcon /> Models</h2>
        <ul className="nav-list nav-list--indented" aria-labelledby="nav-models">
          {c.models.map((m) => (
            <li key={m.id}><span className="nav-link nav-link--static">{m.name}</span></li>
          ))}
        </ul>
        {c.models.length === 0 && <p className="nav-empty">No deployed models.</p>}
      </div>
    </>
  );
}

const iconProps = {
  className: 'nav-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
};
const BuildingIcon = () => <svg {...iconProps}><path d="M4 21V5l8-2v18M12 7l8 2v12M3 21h18M7.5 8h1M7.5 12h1M7.5 16h1M15.5 12h1M15.5 16h1" /></svg>;
const LayersIcon = () => <svg {...iconProps}><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></svg>;
const CubeIcon = () => <svg {...iconProps}><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></svg>;
