import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MESSAGES, findMessage, participants, type Message } from '../../data/vault/messages';
import { person } from '../../data/vault/org';
import { findView, useReview } from '../../data/vault/review';
import { useStored, useStoreVersion } from '../../data/store';
import { usePageTitle } from '../../components/usePageTitle';
import { BackIcon, PaneBottomIcon, PaneRightIcon, SearchIcon } from '../../components/vault/icons';
import { plural } from '../../components/vault/format';
import MessageList, { type Sort } from './MessageList';
import MessageReader from './MessageReader';
import NotFoundInline from '../NotFoundInline';

type Pane = 'bottom' | 'right';

const searchable = (m: Message) =>
  [m.subject, ...participants(m).flatMap((id) => [person(id).name, person(id).address]), ...(m.body ?? []), ...(m.turns ?? []).map((t) => t.text)]
    .join(' ').toLowerCase();

function compare(a: Message, b: Message, s: Sort) {
  const v = (m: Message) => (s.key === 'date' ? m.date : s.key === 'size' ? m.kb : s.key === 'sender' ? person(m.from).name : m.subject.toLowerCase());
  const x = v(a), y = v(b);
  const d = x < y ? -1 : x > y ? 1 : 0;
  return s.dir === 'asc' ? d : -d;
}

/** Outlook-style review: the message list, and the open message in a reading pane below or beside it. */
export default function MessagesPage() {
  const { viewId, messageId } = useParams();
  const view = findView(viewId);
  useStoreVersion();
  const r = useReview();
  const [pane, setPane] = useStored<Pane>('pane', () => 'bottom');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>({ key: 'date', dir: 'desc' });
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const selected = findMessage(messageId);

  // The view's members are fixed when it opens, so clearing a match doesn't pull the row out from under you.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const members = useMemo(() => new Set(view ? MESSAGES.filter((m) => view.test(m, r)).map((m) => m.id) : []), [viewId]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MESSAGES.filter((m) => members.has(m.id) && (!q || searchable(m).includes(q))).sort((a, b) => compare(a, b, sort));
  }, [members, query, sort]);

  // Opening a message marks it read.
  useEffect(() => { if (selected) r.setRead([selected.id], true); }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setChecked(new Set()); }, [viewId]);

  const h = usePageTitle(selected ? selected.subject : `Vault: ${view?.label ?? 'Messages'}`);
  if (!view || (messageId && !selected)) return <div className="lab-main"><NotFoundInline headingRef={h} what={view ? 'message' : 'view'} /></div>;

  const unread = rows.filter((m) => r.isUnread(m)).length;
  const bulk = (read: boolean) => { r.setRead([...checked], read); setChecked(new Set()); };

  return (
    <div className={`mail mail--${pane}${selected ? ' has-message' : ''}`}>
      <section className="mail__list" aria-labelledby="list-title">
        <div className="mail__toolbar">
          <div className="mail__title">
            <h1 id="list-title" className="mail__h1">{view.label}</h1>
            <p className="mail__count" role="status">
              {plural(rows.length, 'message')}{unread > 0 && <>, {unread} unread</>}
            </p>
          </div>

          <label className="search">
            <SearchIcon />
            <span className="visually-hidden">Search messages</span>
            <input type="search" placeholder="Search by keyword, person or address" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>

          <div className="segmented" role="group" aria-label="Reading pane">
            <button type="button" aria-pressed={pane === 'bottom'} onClick={() => setPane('bottom')} title="Reading pane below">
              <PaneBottomIcon /><span className="visually-hidden">Below the list</span>
            </button>
            <button type="button" aria-pressed={pane === 'right'} onClick={() => setPane('right')} title="Reading pane on the right">
              <PaneRightIcon /><span className="visually-hidden">Beside the list</span>
            </button>
          </div>
        </div>

        {checked.size > 0 && (
          <div className="bulkbar" role="region" aria-label="Selected messages">
            <span className="bulkbar__count">{checked.size} selected</span>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => bulk(true)}>Mark as read</button>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => bulk(false)}>Mark as unread</button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setChecked(new Set())}>Clear selection</button>
          </div>
        )}

        <MessageList
          rows={rows}
          viewId={view.id}
          selectedId={selected?.id}
          review={r}
          sort={sort}
          onSort={setSort}
          checked={checked}
          onCheck={setChecked}
          empty={query ? `No messages in ${view.label.toLowerCase()} match “${query}”.` : `No messages in ${view.label.toLowerCase()}.`}
        />
      </section>

      <section className="mail__reader" aria-label={selected ? 'Open message' : 'Reading pane'} data-scroll>
        {selected ? (
          <>
            <Link to={`/vault/${view.id}`} className="back-link mail__back"><BackIcon /> {view.label}</Link>
            <MessageReader m={selected} review={r} />
          </>
        ) : (
          <div className="reader-empty">
            <p className="reader-empty__title">No message open</p>
            <p>Choose a message to read it and review its policy matches.</p>
          </div>
        )}
      </section>
    </div>
  );
}
