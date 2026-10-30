import { Link } from 'react-router-dom';
import { CUSTOMERS, solutionsOf } from '../data/customers';
import { useStoreVersion } from '../data/store';
import { usePageTitle } from '../components/usePageTitle';
import { formatDate } from '../components/format';

export default function CustomersPage() {
  const h = usePageTitle('Customers');
  useStoreVersion();
  const solutions = CUSTOMERS.reduce((n, c) => n + solutionsOf(c).length, 0);
  const live = CUSTOMERS.reduce((n, c) => n + c.models.filter((m) => m.enabled).length, 0);

  return (
    <div className="page">
      <header className="page-head">
        <h1 ref={h} tabIndex={-1} className="page-title">Customers</h1>
        <p className="page-sub">
          {CUSTOMERS.length} customers, {solutions} solutions, {live} models live in surveillance.
        </p>
      </header>

      <div className="table-wrap">
        <table className="table">
          <caption className="visually-hidden">All customers, with sector, vault region, solution count and live models</caption>
          <thead>
            <tr>
              <th scope="col">Customer</th>
              <th scope="col">Sector</th>
              <th scope="col">Vault region</th>
              <th scope="col" className="num">Solutions</th>
              <th scope="col" className="num">Live models</th>
              <th scope="col">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {CUSTOMERS.map((c) => (
              <tr key={c.id}>
                <th scope="row"><Link to={`/lab/${c.id}`} className="row-link">{c.name}</Link></th>
                <td>{c.sector}</td>
                <td>{c.region}</td>
                <td className="num">{solutionsOf(c).length || <span className="tag">Onboarding</span>}</td>
                <td className="num">{c.models.filter((m) => m.enabled).length}</td>
                <td><time dateTime={c.lastActivity}>{formatDate(c.lastActivity)}</time></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
