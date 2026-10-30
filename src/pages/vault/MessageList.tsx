import { useEffect, useRef, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Message } from '../../data/vault/messages';
import { findChannel, person } from '../../data/vault/org';
import { matchesOf, openMatches, type Review } from '../../data/vault/review';
import HoverCard from '../../components/HoverCard';
import { PolicyMatchesCard, PredictionsCard } from '../../components/vault/cards';
import { ChannelIcon, ClipIcon, FlagIcon, SparkIcon } from '../../components/vault/icons';
import { formatDateTime, formatKb, plural, tzLabel } from '../../components/vault/format';

export type SortKey = 'sender' | 'subject' | 'date' | 'size';
export interface Sort { key: SortKey; dir: 'asc' | 'desc' }

interface Props {
  rows: Message[];
  viewId: string;
  selectedId?: string;
  review: Review;
  sort: Sort;
  onSort: (s: Sort) => void;
  checked: Set<string>;
  onCheck: (s: Set<string>) => void;
  empty: string;
}

/**
 * The message table. Each row opens its message; the subject is the row's link,
 * so Tab reaches one stop per row and Up/Down move between rows and open them.
 */
export default function MessageList({ rows, viewId, selectedId, review: r, sort, onSort, checked, onCheck, empty }: Props) {
  const navigate = useNavigate();
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const href = (m: Message) => `/vault/${viewId}/${m.id}`;

  // Keep the open message's row in view, e.g. after following a link to it.
  useEffect(() => {
    bodyRef.current?.querySelector('tr.is-current')?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  const onKeyDown = (e: KeyboardEvent<HTMLTableSectionElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const links = [...(bodyRef.current?.querySelectorAll<HTMLAnchorElement>('.msg-link') ?? [])];
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (at < 0) return;
    e.preventDefault();
    const next = at + (e.key === 'ArrowDown' ? 1 : -1);
    if (next < 0 || next >= rows.length) return;
    links[next].focus();
    links[next].scrollIntoView({ block: 'nearest' });
    navigate(href(rows[next]), { replace: true });
  };

  const allChecked = rows.length > 0 && rows.every((m) => checked.has(m.id));
  const someChecked = rows.some((m) => checked.has(m.id));
  const toggleAll = () => onCheck(allChecked ? new Set() : new Set(rows.map((m) => m.id)));
  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id); else next.add(id);
    onCheck(next);
  };

  const sortable = (k: SortKey, label: string, className?: string) => {
    const active = sort.key === k;
    return (
      <th key={k} scope="col" className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
        <button type="button" className={`sort${active ? ' is-active' : ''}`}
          onClick={() => onSort({ key: k, dir: active && sort.dir === 'desc' ? 'asc' : active ? 'desc' : k === 'date' || k === 'size' ? 'desc' : 'asc' })}>
          {label}
          <svg className={`sort__arrow${active && sort.dir === 'asc' ? ' is-up' : ''}`} viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
        </button>
      </th>
    );
  };

  return (
    <div className="mail__scroll" data-scroll>
      <table className="msg-table">
        <caption className="visually-hidden">Messages, sorted by {sort.key} {sort.dir === 'asc' ? 'ascending' : 'descending'}. Up and Down arrows move between messages.</caption>
        <thead>
          <tr>
            <th scope="col" className="col-check">
              <input type="checkbox" checked={allChecked} ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked; }}
                onChange={toggleAll} aria-label="Select all messages" />
            </th>
            <th scope="col" className="col-icon"><span className="visually-hidden">Unread</span></th>
            <th scope="col" className="col-icon"><span className="visually-hidden">Channel</span></th>
            <th scope="col" className="col-icon col-att"><ClipIcon /><span className="visually-hidden">Attachments</span></th>
            {sortable('sender', "Sender", 'col-sender')}
            <th scope="col" className="col-rcpt">Recipients</th>
            {sortable('subject', "Subject", 'col-subject')}
            <th scope="col" className="col-icon"><FlagIcon /><span className="visually-hidden">Policy matches</span></th>
            <th scope="col" className="col-icon col-ai"><SparkIcon /><span className="visually-hidden">AI predictions</span></th>
            {sortable('date', `Date (${tzLabel()})`, 'col-date')}
            {sortable('size', "Size", 'col-size num')}
          </tr>
        </thead>
        <tbody ref={bodyRef} onKeyDown={onKeyDown}>
          {rows.map((m) => {
            const unread = r.isUnread(m);
            const channel = findChannel(m.channel)!;
            const from = person(m.from);
            const total = matchesOf(m, r).length;
            const open = openMatches(m, r).length;
            const current = m.id === selectedId;
            return (
              <tr key={m.id} className={`${unread ? 'is-unread' : ''}${current ? ' is-current' : ''}`}
                onClick={(e) => { if (!(e.target as HTMLElement).closest('input, a')) navigate(href(m)); }}>
                <td className="col-check">
                  <input type="checkbox" checked={checked.has(m.id)} onChange={() => toggle(m.id)} aria-label={`Select “${m.subject}”`} />
                </td>
                <td className="col-icon">
                  {unread && <span className="unread-dot" title="Unread"><span className="visually-hidden">Unread</span></span>}
                </td>
                <td className="col-icon" title={channel.name}>
                  <ChannelIcon id={m.channel} /><span className="visually-hidden">{channel.name}</span>
                </td>
                <td className="col-icon col-att">
                  {m.attachments.length > 0 && <span title={plural(m.attachments.length, 'attachment')}><ClipIcon /><span className="visually-hidden">{plural(m.attachments.length, 'attachment')}</span></span>}
                </td>
                <td className="col-sender"><span className="cell-trunc">{from.internal ? from.name : from.address}</span></td>
                <td className="col-rcpt"><span className="cell-trunc">{m.to.map((id) => person(id).address).join(', ')}</span></td>
                <td className="col-subject">
                  <Link to={href(m)} className="msg-link" aria-current={current ? 'true' : undefined}>
                    <span className="cell-trunc">{m.subject}</span>
                  </Link>
                </td>
                <td className="col-icon">
                  {total > 0 && (
                    <HoverCard
                      className={`flag-btn${open === 0 ? ' is-cleared' : ''}`}
                      label={`${plural(total, 'policy match', 'policy matches')}, ${open} open`}
                      card={<PolicyMatchesCard m={m} r={r} />}
                    >
                      <FlagIcon filled={open > 0} />
                      {open > 0 && <span className="flag-btn__n" aria-hidden="true">{open}</span>}
                    </HoverCard>
                  )}
                </td>
                <td className="col-icon col-ai">
                  <HoverCard className="ai-btn" label="AI predictions" card={<PredictionsCard m={m} />}>
                    <SparkIcon />
                  </HoverCard>
                </td>
                <td className="col-date"><span className="mono-num">{formatDateTime(m.date)}</span></td>
                <td className="col-size num"><span className="mono-num">{formatKb(m.kb)}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className="list-empty" role="status">{empty}</p>}
    </div>
  );
}
