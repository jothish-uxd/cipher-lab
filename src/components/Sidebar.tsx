import { useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { CUSTOMERS, findCustomer } from '../data/customers';

/** Service view: all customers. Inside a customer: its solutions and models. */
export default function Sidebar() {
  const { customerId } = useParams();
  const customer = findCustomer(customerId);
  return (
    <aside className="sidebar" aria-label={customer ? `${customer.name} navigation` : 'Customers'}>
      {customer ? <CustomerNav customerId={customer.id} /> : <CustomerList />}
    </aside>
  );
}

function CustomerList() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const list = CUSTOMERS.filter((c) => !q || c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q));
  return (
    <nav aria-label="Customers">
      <h2 className="sidebar__title">Customers</h2>
      <label className="field">
        <span className="visually-hidden">Filter customers</span>
        <input
          type="search"
          className="field__input"
          placeholder="Filter customers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <ul className="nav-list" aria-live="polite">
        {list.map((c) => (
          <li key={c.id}>
            <NavLink to={`/studio/${c.id}`} className="nav-item">
              <span className="nav-item__name">{c.name}</span>
              <span className="nav-item__meta">
                {c.solutions.length} {c.solutions.length === 1 ? 'solution' : 'solutions'}
              </span>
            </NavLink>
          </li>
        ))}
        {list.length === 0 && <li className="nav-empty">No customers match “{query}”.</li>}
      </ul>
    </nav>
  );
}

function CustomerNav({ customerId }: { customerId: string }) {
  const c = findCustomer(customerId)!;
  return (
    <nav aria-label={`${c.name} solutions and models`}>
      <Link to="/studio" className="back-link">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        All customers
      </Link>
      <h2 className="sidebar__customer">
        <NavLink to={`/studio/${c.id}`} end className="sidebar__customer-link">{c.name}</NavLink>
      </h2>

      <h3 className="sidebar__group" id="nav-solutions">Solutions</h3>
      <ul className="nav-list" aria-labelledby="nav-solutions">
        {c.solutions.map((s) => (
          <li key={s.id}>
            <NavLink to={`/studio/${c.id}/solutions/${s.id}`} className="nav-item nav-item--compact">
              {s.name}
            </NavLink>
          </li>
        ))}
        {c.solutions.length === 0 && <li className="nav-empty">No solutions yet.</li>}
      </ul>
      <button type="button" className="add-button" aria-disabled="true" title="Coming in a later build">
        <PlusIcon /> New solution
      </button>

      <h3 className="sidebar__group" id="nav-models">Models</h3>
      <ul className="nav-list" aria-labelledby="nav-models">
        {c.models.map((m) => (
          <li key={m.id}><span className="nav-item nav-item--compact nav-item--static">{m.name}</span></li>
        ))}
        {c.models.length === 0 && <li className="nav-empty">No deployed models.</li>}
      </ul>
      <button type="button" className="add-button" aria-disabled="true" title="Coming in a later build">
        <PlusIcon /> New model
      </button>
    </nav>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
