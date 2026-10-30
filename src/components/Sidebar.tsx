import { useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { CUSTOMERS, PINNED, findCustomer, solutionsOf, type Customer } from '../data/customers';
import { useStoreVersion } from '../data/store';

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
  const matches = (c: Customer) => !q || c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q);
  const pinned = PINNED.map((id) => findCustomer(id)!).filter(matches);
  const rest = CUSTOMERS
    .filter((c) => !PINNED.includes(c.id) && matches(c))
    .sort((a, b) => a.name.localeCompare(b.name));
  const none = pinned.length === 0 && rest.length === 0;

  return (
    <>
      <label className="filter">
        <span className="visually-hidden">Filter customers</span>
        <input type="search" placeholder="Filter customers" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      {pinned.length > 0 && (
        <div className="nav-group">
          <h2 className="nav-heading" id="nav-pinned"><PinIcon /> Pinned</h2>
          <ul className="nav-list" aria-labelledby="nav-pinned">
            {pinned.map((c) => (
              <li key={c.id}><NavLink to={`/lab/${c.id}`} className="nav-link">{c.name}</NavLink></li>
            ))}
          </ul>
        </div>
      )}

      {rest.length > 0 && (
        <div className="nav-group nav-group--untitled">
          {/* No visible title; named for screen readers. */}
          <h2 className="visually-hidden" id="nav-all">All other customers, A to Z</h2>
          <ul className="nav-list" aria-labelledby="nav-all">
            {rest.map((c) => (
              <li key={c.id}><NavLink to={`/lab/${c.id}`} className="nav-link">{c.name}</NavLink></li>
            ))}
          </ul>
        </div>
      )}

      {none && <p className="nav-empty nav-empty--flush" role="status">No customers match “{query}”.</p>}
    </>
  );
}

function CustomerNav({ customerId }: { customerId: string }) {
  const c = findCustomer(customerId)!;
  useStoreVersion();
  const solutions = solutionsOf(c);
  return (
    <>
      <div className="nav-group">
        <Link to="/lab" className="back-link">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          All customers
        </Link>
        <ul className="nav-list">
          <li><NavLink to={`/lab/${c.id}`} end className="nav-link nav-link--strong">{c.name}</NavLink></li>
        </ul>
      </div>

      <div className="nav-group">
        <h2 className="nav-heading" id="nav-solutions"><LayersIcon /> Solutions</h2>
        <ul className="nav-list nav-list--indented" aria-labelledby="nav-solutions">
          {solutions.map((s) => (
            <li key={s.id}>
              <NavLink to={`/lab/${c.id}/solutions/${s.id}`} className="nav-link">{s.name}</NavLink>
            </li>
          ))}
        </ul>
        {solutions.length === 0 && <p className="nav-empty">No solutions yet.</p>}
        <Link to={`/lab/${c.id}/solutions/new`} className="nav-add">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          New solution
        </Link>
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
const PinIcon = () => <svg {...iconProps}><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6zM12 14v7" /></svg>;
const LayersIcon = () => <svg {...iconProps}><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></svg>;
const CubeIcon = () => <svg {...iconProps}><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></svg>;
