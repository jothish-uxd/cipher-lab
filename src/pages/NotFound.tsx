import { Link } from 'react-router-dom';
import { usePageTitle } from '../components/usePageTitle';

export default function NotFound() {
  const h = usePageTitle('Page not found');
  return (
    <main id="main" className="page page--narrow">
      <h1 ref={h} tabIndex={-1} className="page-title">This page doesn’t exist</h1>
      <p className="lede">The link may be from an earlier build. Go to the <Link to="/studio">customer list</Link> or the <Link to="/overview">overview</Link>.</p>
    </main>
  );
}
