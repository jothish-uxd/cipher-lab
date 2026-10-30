import { Link, NavLink } from 'react-router-dom';
import { CHANNEL_VIEWS, POLICY_VIEWS, STATUS_VIEWS, countIn, useReview, type View } from '../../data/vault/review';
import { useStoreVersion } from '../../data/store';
import { labRoutes } from '../../data/vault/lab';
import { ChatsIcon, InboxIcon, ShieldIcon } from './icons';

/** Review queues, then policies, then channels. Counts update as messages are read and cleared. */
export default function VaultSidebar({ open }: { open: boolean }) {
  useStoreVersion();
  const r = useReview();

  const group = (id: string, title: string, icon: JSX.Element, views: View[], extra?: JSX.Element) => (
    <div className="nav-group">
      <h2 className="nav-heading" id={`nav-${id}`}>{icon} {title}</h2>
      <ul className="nav-list nav-list--indented" aria-labelledby={`nav-${id}`}>
        {views.map((v) => {
          const n = countIn(v, r);
          return (
            <li key={v.id}>
              <NavLink
                to={`/vault/${v.id}`}
                className="nav-link nav-link--count"
              >
                <span>{v.label}</span>
                <span className="nav-count" aria-label={`${n} messages`}>{n}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
      {extra}
    </div>
  );

  return (
    <nav id="sidebar" className={`sidebar${open ? ' is-open' : ''}`} aria-label="Message views">
      {group('review', 'Review', <InboxIcon />, STATUS_VIEWS)}
      {group('policies', 'Policies', <ShieldIcon />, POLICY_VIEWS,
        <NavLink to="/vault/policies" className="nav-add">Manage policies</NavLink>)}
      {group('channels', 'Channels', <ChatsIcon />, CHANNEL_VIEWS)}
      <div className="sidebar-foot">
        <Link to={labRoutes.customer()} className="sidebar-lab">Models are built in the Lab</Link>
        <p className="sidebar-credit">Placeholder data from the Star Wars galaxy.</p>
      </div>
    </nav>
  );
}
