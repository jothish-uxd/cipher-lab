import { useStored } from '../store';
import { MESSAGES, participants, type Match, type MatchStatus, type Message } from './messages';
import { CHANNELS, PEOPLE, TAGS } from './org';
import { POLICIES } from './policies';

/*
  The compliance officer's review work: what they have read and the status
  of each policy match. Saved in the browser through the store.
*/

type ReadMap = Record<string, boolean>;
type StatusMap = Record<string, MatchStatus>;

export interface Review {
  isUnread: (m: Message) => boolean;
  setRead: (ids: string[], read: boolean) => void;
  statusOf: (m: Message, policy: string, i: number) => MatchStatus;
  setStatus: (m: Message, policy: string, i: number, s: MatchStatus) => void;
}

const statusKey = (m: Message, policy: string, i: number) => `${m.id}/${policy}/${i}`;

export function useReview(): Review {
  const [read, setReadMap] = useStored<ReadMap>('vault:read', () => ({}));
  const [status, setStatusMap] = useStored<StatusMap>('vault:status', () => ({}));
  return {
    isUnread: (m) => !(read[m.id] ?? !m.unread),
    setRead: (ids, r) => setReadMap((prev) => ({ ...prev, ...Object.fromEntries(ids.map((id) => [id, r])) })),
    statusOf: (m, policy, i) => status[statusKey(m, policy, i)] ?? m.hits.find((h) => h.policy === policy)?.matches[i]?.status ?? 'flagged',
    setStatus: (m, policy, i, s) => setStatusMap((prev) => ({ ...prev, [statusKey(m, policy, i)]: s })),
  };
}

export const STATUS_OPTIONS: { value: MatchStatus; label: string }[] = [
  { value: 'flagged', label: 'Flagged' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'cleared', label: 'Cleared' },
];
export const statusLabel = (s: MatchStatus) => STATUS_OPTIONS.find((o) => o.value === s)!.label;

/** Every match on a message with its live status. */
export function matchesOf(m: Message, r: Review) {
  return m.hits.flatMap((h) => h.matches.map((match: Match, i) => ({ policy: h.policy, i, match, status: r.statusOf(m, h.policy, i) })));
}
export const openMatches = (m: Message, r: Review) => matchesOf(m, r).filter((x) => x.status !== 'cleared');

/** Classification tags on a message: every tag its internal participants belong to. */
export function tagsOf(m: Message) {
  const ids = new Set(participants(m).flatMap((pid) => PEOPLE.find((p) => p.id === pid)?.tags ?? []));
  return TAGS.filter((t) => ids.has(t.id));
}

/* ---------- Views (left nav) ---------- */

export interface View { id: string; label: string; test: (m: Message, r: Review) => boolean }

export const STATUS_VIEWS: View[] = [
  { id: 'all', label: 'All messages', test: () => true },
  { id: 'unread', label: 'Unread', test: (m, r) => r.isUnread(m) },
  { id: 'flagged', label: 'Needs review', test: (m, r) => matchesOf(m, r).some((x) => x.status === 'flagged') },
  { id: 'escalated', label: 'Escalated', test: (m, r) => matchesOf(m, r).some((x) => x.status === 'escalated') },
  { id: 'cleared', label: 'Cleared', test: (m, r) => m.hits.length > 0 && openMatches(m, r).length === 0 },
];
export const POLICY_VIEWS: View[] = POLICIES.map((p) => ({
  id: `policy-${p.id}`, label: p.name, test: (m) => m.hits.some((h) => h.policy === p.id),
}));
export const CHANNEL_VIEWS: View[] = CHANNELS.map((c) => ({
  id: `channel-${c.id}`, label: c.name, test: (m) => m.channel === c.id,
}));
export const findView = (id?: string) => [...STATUS_VIEWS, ...POLICY_VIEWS, ...CHANNEL_VIEWS].find((v) => v.id === id);

export const countIn = (v: View, r: Review) => MESSAGES.filter((m) => v.test(m, r)).length;
