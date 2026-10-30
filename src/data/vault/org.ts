import { ORG } from './lab';

/*
  The organisation behind the vault: its people, the classification tags that
  group them (desks, regions, supervision lists) and the channels their
  messages arrive from. Placeholder data from the Star Wars galaxy.
*/

export interface Person {
  id: string;
  name: string;
  address: string;
  title?: string;
  internal: boolean;
  /** Classification tags the person belongs to */
  tags: string[];
}

export interface Tag {
  id: string;
  path: string[];
  group: string;
}

const R = ORG.region;
export const TAGS: Tag[] = [
  { id: 'heightened', path: ['Heightened supervision'], group: 'Heightened supervision' },
  { id: 'or', path: [R], group: `${R} — all staff` },
  { id: 'or-ib', path: [R, 'Investment Banking'], group: 'Investment Banking' },
  { id: 'or-research', path: [R, 'Research'], group: 'Research' },
  { id: 'or-compliance', path: [R, 'Compliance'], group: 'Compliance' },
  { id: 'or-trading', path: [R, 'Trading'], group: 'Trading' },
  { id: 'or-deriv', path: [R, 'Trading', 'Derivatives'], group: 'Derivatives' },
  { id: 'or-dh-deriv', path: [R, 'Trading', 'Desk Head – Derivatives'], group: 'Desk Head – Derivatives' },
  { id: 'or-equities', path: [R, 'Trading', 'Equities'], group: 'Equities' },
  { id: 'or-wealth', path: [R, 'Wealth Management'], group: 'Wealth Management' },
];
export const findTag = (id: string) => TAGS.find((t) => t.id === id)!;

const p = (id: string, name: string, address: string, title: string | undefined, tags: string[]): Person =>
  ({ id, name, address, title, internal: address.endsWith('@igbc.bank'), tags });

export const PEOPLE: Person[] = [
  p('san-hill', 'San Hill', 'san.hill@igbc.bank', 'Chair', ['or', 'or-ib', 'heightened']),
  p('tonith', 'Pors Tonith', 'pors.tonith@igbc.bank', 'Desk head, derivatives', ['or', 'or-trading', 'or-deriv', 'or-dh-deriv', 'heightened']),
  p('kolma', 'Tay Kolma', 'tay.kolma@igbc.bank', 'Relationship manager', ['or', 'or-wealth']),
  p('dellso', 'Gizor Dellso', 'gizor.dellso@igbc.bank', 'Equities trader', ['or', 'or-trading', 'or-equities']),
  p('taun-we', 'Taun We', 'taun.we@igbc.bank', 'Research analyst', ['or', 'or-research']),
  p('nossor', 'Nossor Ri', 'nossor.ri@igbc.bank', 'Derivatives trader', ['or', 'or-trading', 'or-deriv']),
  p('clovis', 'Rush Clovis', 'rush.clovis@igbc.bank', 'Compliance officer', ['or', 'or-compliance']),
  // External
  p('han', 'Han Solo', 'han.solo@han.com', undefined, []),
  p('lando', 'Lando Calrissian', 'lando@cloudcity.bespin', undefined, []),
  p('krim', 'Marg Krim', 'm.krim@pyke.kessel', undefined, []),
  p('vos', 'Dryden Vos', 'dvos@crimsondawn.co', undefined, []),
  p('sculdun', 'Davo Sculdun', 'davo@sculdun.chandrila', undefined, []),
  p('dod', 'Lott Dod', 'senator.dod@tradefed.gov', undefined, []),
];
export const person = (id: string) => PEOPLE.find((x) => x.id === id)!;
export const membersOf = (tagId: string) => PEOPLE.filter((x) => x.tags.includes(tagId));

/** The compliance officer using the vault: the customer-side compliance reviewer on the lab's IGBC solutions. */
export const CURRENT_USER = { name: 'Rush Clovis', role: 'Compliance officer', initials: 'RC' };

export type ChannelId = 'email' | 'teams' | 'whatsapp' | 'sms' | 'messenger' | 'linkedin' | 'bloomberg';
export interface Channel { id: ChannelId; name: string; chat: boolean }
export const CHANNELS: Channel[] = [
  { id: 'email', name: 'Email', chat: false },
  { id: 'teams', name: 'Teams', chat: true },
  { id: 'bloomberg', name: 'Bloomberg Chat', chat: true },
  { id: 'whatsapp', name: 'WhatsApp', chat: true },
  { id: 'sms', name: 'Text message', chat: true },
  { id: 'messenger', name: 'Facebook Messenger', chat: true },
  { id: 'linkedin', name: 'LinkedIn', chat: true },
];
export const findChannel = (id: string) => CHANNELS.find((c) => c.id === id);
