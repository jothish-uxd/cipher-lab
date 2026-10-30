import type { ChannelId } from './org';
import { CHANNELS, person } from './org';

/*
  Placeholder messages held in the vault. In the real product these come from
  capture connectors (email journaling, chat archivers, mobile capture).
*/

export type MatchStatus = 'flagged' | 'escalated' | 'cleared';

export interface Match {
  /** Classification tag the policy matched under */
  tag: string;
  via: 'lexicon' | 'model';
  terms?: string[];
  score?: number;
  status?: MatchStatus; // starting status, before anyone reviews it
}
export interface PolicyHit { policy: string; matches: Match[] }

export interface Turn { from: string; at: string; text: string }
export interface Attachment { name: string; kb: number }

export interface Predictions {
  business: 'Business' | 'Personal';
  language: string;      // "English" or "Non-English (…)"
  sentiment: number;     // 0 negative … 1 positive
}

export interface Message {
  id: string;
  channel: ChannelId;
  from: string;          // person id
  to: string[];
  cc?: string[];
  subject: string;
  date: string;          // ISO, UTC
  kb: number;
  attachments: Attachment[];
  body?: string[];       // email paragraphs
  turns?: Turn[];        // chat transcript
  unread: boolean;
  hits: PolicyHit[];
  predictions: Predictions;
}

const RICH: Message[] = [
  {
    id: 'm-1042', channel: 'email', from: 'san-hill', to: ['dod'], cc: ['tonith'],
    subject: 'Consideration for the trade bill', date: '2026-10-29T16:12:00Z', kb: 48, unread: true,
    attachments: [{ name: 'Senate-calendar-Q4.pdf', kb: 212 }, { name: 'Box-seating.png', kb: 96 }],
    body: [
      'Senator,',
      'Thank you for your time on Tuesday. The Clan remains a firm friend of the Trade Federation and we would like that friendship to show when the shipping bill reaches committee.',
      'As a small consideration for the senator’s continued support, we have reserved the box at the Boonta Eve podrace for you and your guests. Pors will arrange transport from the Muunilinst landing platform.',
      'The rest we can discuss in person, off the books, as before.',
      'With respect,\nSan Hill\nChair, InterGalactic Banking Clan',
    ],
    hits: [
      { policy: 'bribery', matches: [
        { tag: 'or-ib', via: 'lexicon', terms: ['consideration for', 'for the senator', 'off the books'] },
        { tag: 'heightened', via: 'lexicon', terms: ['off the books'] },
      ] },
      { policy: 'gifts', matches: [{ tag: 'or-ib', via: 'lexicon', terms: ['box at', 'podrace'] }] },
    ],
    predictions: { business: 'Business', language: 'English', sentiment: 0.78 },
  },
  {
    id: 'm-1041', channel: 'whatsapp', from: 'tonith', to: ['krim'],
    subject: 'Kessel settlement', date: '2026-10-29T09:41:00Z', kb: 6, unread: true, attachments: [],
    turns: [
      { from: 'krim', at: '2026-10-29T09:30:00Z', text: 'Shipment landed. Ninety thousand to settle by Friday.' },
      { from: 'tonith', at: '2026-10-29T09:33:00Z', text: 'Too big for one transfer. I’ll split it across the three Muunilinst accounts, each under the limit.' },
      { from: 'krim', at: '2026-10-29T09:36:00Z', text: 'Same as last spice run then. Fine.' },
      { from: 'tonith', at: '2026-10-29T09:41:00Z', text: 'Delete this once you’ve read it. Bargon’ya.' },
    ],
    hits: [
      { policy: 'aml', matches: [
        { tag: 'or-dh-deriv', via: 'model', score: 0.88 },
        { tag: 'or-deriv', via: 'lexicon', terms: ['split it', 'under the limit', 'spice'] },
      ] },
      { policy: 'off-channel', matches: [{ tag: 'or', via: 'lexicon', terms: ['delete this'] }] },
    ],
    predictions: { business: 'Business', language: 'Non-English (Huttese)', sentiment: 0.41 },
  },
  {
    id: 'm-1040', channel: 'teams', from: 'nossor', to: ['tonith'],
    subject: 'Hedge book for Muunilinst', date: '2026-10-28T22:05:00Z', kb: 4, unread: false, attachments: [],
    turns: [
      { from: 'nossor', at: '2026-10-28T21:58:00Z', text: 'Rolled the Muunilinst hedge into December. Delta is flat.' },
      { from: 'tonith', at: '2026-10-28T22:01:00Z', text: 'Good. Send the risk report to the desk before the open.' },
      { from: 'nossor', at: '2026-10-28T22:05:00Z', text: 'Will do.' },
    ],
    hits: [],
    predictions: { business: 'Business', language: 'English', sentiment: 0.62 },
  },
  {
    id: 'm-1039', channel: 'email', from: 'kolma', to: ['sculdun'],
    subject: 'Restructuring your Chandrila accounts', date: '2026-10-28T17:20:00Z', kb: 31, unread: true,
    attachments: [{ name: 'Account-structure.xlsx', kb: 58 }],
    body: [
      'Davo,',
      'As discussed, we can move the funds through a shell company registered on Ghorman before they reach the Chandrila accounts. Two more hops and the trail is clean.',
      'The structure is in the attached sheet. I’d rather we didn’t put the amounts in writing.',
      'Tay',
    ],
    hits: [{ policy: 'aml', matches: [
      { tag: 'or-wealth', via: 'model', score: 0.71 },
      { tag: 'or-wealth', via: 'lexicon', terms: ['shell'] },
    ] }],
    predictions: { business: 'Business', language: 'English', sentiment: 0.55 },
  },
  {
    id: 'm-1038', channel: 'sms', from: 'lando', to: ['dellso'],
    subject: 'Podrace Sunday?', date: '2026-10-27T19:44:00Z', kb: 2, unread: false, attachments: [],
    turns: [
      { from: 'lando', at: '2026-10-27T19:40:00Z', text: 'Got two tickets for the podrace Sunday. Box at the finish line. You in?' },
      { from: 'dellso', at: '2026-10-27T19:44:00Z', text: 'In. Put the cantina tab on me this time.' },
    ],
    hits: [{ policy: 'gifts', matches: [{ tag: 'or-trading', via: 'lexicon', terms: ['tickets', 'podrace', 'box at', 'cantina tab'], status: 'cleared' }] }],
    predictions: { business: 'Personal', language: 'English', sentiment: 0.91 },
  },
  {
    id: 'm-1037', channel: 'bloomberg', from: 'vos', to: ['nossor'],
    subject: 'Coaxium forwards', date: '2026-10-27T14:02:00Z', kb: 5, unread: true, attachments: [],
    turns: [
      { from: 'vos', at: '2026-10-27T13:55:00Z', text: 'Need the coaxium forwards priced before Kijimi opens.' },
      { from: 'nossor', at: '2026-10-27T13:58:00Z', text: 'Tight market. Can’t promise the level.' },
      { from: 'vos', at: '2026-10-27T14:00:00Z', text: 'There’s a sweetener in it for you if the level holds. Call me on my personal.' },
      { from: 'nossor', at: '2026-10-27T14:02:00Z', text: 'Understood.' },
    ],
    hits: [
      { policy: 'bribery', matches: [{ tag: 'or-deriv', via: 'lexicon', terms: ['sweetener'] }] },
      { policy: 'off-channel', matches: [{ tag: 'or', via: 'lexicon', terms: ['call me on', 'my personal'] }] },
    ],
    predictions: { business: 'Business', language: 'English', sentiment: 0.47 },
  },
  {
    id: 'm-1036', channel: 'linkedin', from: 'han', to: ['taun-we'],
    subject: 'Kessel route research', date: '2026-10-26T11:18:00Z', kb: 3, unread: false, attachments: [],
    turns: [
      { from: 'han', at: '2026-10-26T11:10:00Z', text: 'Saw your note on hyperspace lane pricing. Made the Kessel Run in under twelve parsecs, happy to compare data.' },
      { from: 'taun-we', at: '2026-10-26T11:18:00Z', text: 'Parsecs measure distance, not time, but thank you. I’ll send the published report.' },
    ],
    hits: [],
    predictions: { business: 'Business', language: 'English', sentiment: 0.66 },
  },
  {
    id: 'm-1035', channel: 'messenger', from: 'lando', to: ['kolma'],
    subject: 'New number', date: '2026-10-25T21:37:00Z', kb: 2, unread: false, attachments: [],
    turns: [
      { from: 'lando', at: '2026-10-25T21:35:00Z', text: 'Lost my comlink on Cloud City. Using a burner for now.' },
      { from: 'kolma', at: '2026-10-25T21:37:00Z', text: 'Noted. Anything about your accounts goes through the bank’s line, please.' },
    ],
    hits: [{ policy: 'off-channel', matches: [{ tag: 'or', via: 'lexicon', terms: ['burner'], status: 'cleared' }] }],
    predictions: { business: 'Personal', language: 'English', sentiment: 0.58 },
  },
  {
    id: 'm-1034', channel: 'email', from: 'tonith', to: ['nossor'],
    subject: 'Derivatives desk limits for Q4', date: '2026-10-24T15:00:00Z', kb: 22, unread: false,
    attachments: [{ name: 'Desk-limits-Q4.pdf', kb: 140 }],
    body: ['Nossor,', 'Q4 limits attached. Value-at-risk stays at the Q3 level; the hyperfuel book gets a little more room.', 'Pors'],
    hits: [],
    predictions: { business: 'Business', language: 'English', sentiment: 0.6 },
  },
  {
    id: 'm-1033', channel: 'email', from: 'clovis', to: ['tonith', 'nossor', 'dellso'],
    subject: 'Reminder: recorded channels only', date: '2026-10-23T08:30:00Z', kb: 12, unread: false, attachments: [],
    body: [
      'Team,',
      'A reminder that client and counterparty conversations must stay on recorded channels. If a counterparty asks you to switch to another app, decline and keep the conversation here.',
      'Rush Clovis\nCompliance',
    ],
    hits: [{ policy: 'off-channel', matches: [{ tag: 'or', via: 'lexicon', terms: ['switch to'], status: 'cleared' }] }],
    predictions: { business: 'Business', language: 'English', sentiment: 0.52 },
  },
  {
    id: 'm-1032', channel: 'whatsapp', from: 'dod', to: ['san-hill'],
    subject: 'Committee vote', date: '2026-10-22T20:15:00Z', kb: 4, unread: false, attachments: [],
    turns: [
      { from: 'dod', at: '2026-10-22T20:10:00Z', text: 'The committee votes Thursday. My colleagues expect the envelope before then.' },
      { from: 'san-hill', at: '2026-10-22T20:15:00Z', text: 'It will be delivered. Off the books, as agreed.' },
    ],
    hits: [{ policy: 'bribery', matches: [
      { tag: 'heightened', via: 'lexicon', terms: ['envelope', 'off the books'], status: 'escalated' },
      { tag: 'or-ib', via: 'lexicon', terms: ['envelope', 'off the books'], status: 'escalated' },
    ] }],
    predictions: { business: 'Business', language: 'English', sentiment: 0.44 },
  },
  {
    id: 'm-1031', channel: 'email', from: 'han', to: ['dellso'],
    subject: 'Invoice: cargo run', date: '2026-10-21T10:05:00Z', kb: 18, unread: false,
    attachments: [{ name: 'Invoice-0091.pdf', kb: 64 }],
    body: ['Gizor,', 'Invoice for the cargo run attached. Payment in credits, not Imperial scrip.', 'Han'],
    hits: [],
    predictions: { business: 'Business', language: 'English', sentiment: 0.5 },
  },
];

/* Routine traffic: no policy matches, so the review queue reads as realistic. */
const ROUTINE: [string, string, ChannelId, string, string][] = [
  ['taun-we', 'san-hill', 'email', 'Weekly research digest', 'This week’s note covers hyperlane congestion and the Corellian shipping index.'],
  ['nossor', 'dellso', 'teams', 'Lunch?', 'Dex’s diner at noon?'],
  ['kolma', 'san-hill', 'email', 'Client review: Bespin Mining Guild', 'Portfolio review notes attached for Thursday.'],
  ['dellso', 'taun-we', 'bloomberg', 'Kuat Drive Yards earnings', 'Any view on KDY ahead of results?'],
  ['tonith', 'nossor', 'teams', 'Risk report', 'Thanks, received.'],
  ['san-hill', 'kolma', 'email', 'Board pack', 'Please add the wealth numbers to slide nine.'],
  ['lando', 'kolma', 'email', 'Cloud City quarterly statement', 'Statement received, thank you.'],
  ['taun-we', 'dellso', 'teams', 'Model update', 'Updated the tibanna gas forecast.'],
  ['clovis', 'kolma', 'email', 'Annual attestation', 'Please complete your attestation by the end of the month.'],
  ['nossor', 'tonith', 'bloomberg', 'Hyperfuel curve', 'Curve steepened after the Corellia news.'],
  ['dellso', 'lando', 'sms', 'Running late', 'Ten minutes behind, sorry.'],
  ['kolma', 'sculdun', 'email', 'Meeting confirmation', 'Confirming Tuesday at the Hanna City office.'],
  ['san-hill', 'tonith', 'email', 'Town hall', 'Town hall moves to the main atrium next week.'],
  ['taun-we', 'han', 'linkedin', 'Report link', 'Here is the published report I mentioned.'],
  ['tonith', 'dellso', 'teams', 'Desk drinks', 'Friday after close.'],
  ['nossor', 'taun-we', 'email', 'Data request', 'Could you share the volatility series behind figure 3?'],
  ['kolma', 'lando', 'messenger', 'Thanks', 'Good to see you at the gala.'],
  ['dellso', 'nossor', 'bloomberg', 'Equity flows', 'Heavy selling in Sienar this morning.'],
  ['clovis', 'tonith', 'email', 'Training due', 'Two people on the desk still owe their conduct training.'],
  ['san-hill', 'taun-we', 'email', 'Thanks for the note', 'Useful for the board. Thank you.'],
  ['tonith', 'kolma', 'teams', 'Client intro', 'Happy to meet your client next week.'],
  ['taun-we', 'nossor', 'teams', 'Re: Data request', 'Sent, see the shared folder.'],
];

const routine: Message[] = ROUTINE.map(([from, to, channel, subject, text], i) => {
  const date = new Date(Date.UTC(2026, 9, 20, 18, 0) - i * 7.3 * 3600_000).toISOString();
  const chat = CHANNELS.find((c) => c.id === channel)!.chat;
  return {
    id: `m-${1030 - i}`, channel, from, to: [to], subject, date,
    kb: chat ? 1 + (i % 4) : 8 + ((i * 7) % 30), unread: i % 6 === 2, attachments: [],
    ...(chat ? { turns: [{ from, at: date, text }] } : { body: [`Hi ${person(to).name.split(' ')[0]},`, text, person(from).name.split(' ')[0]] }),
    hits: [],
    predictions: { business: i % 5 === 1 ? 'Personal' : 'Business', language: 'English', sentiment: 0.5 + ((i * 13) % 30) / 100 },
  } satisfies Message;
});

export const MESSAGES: Message[] = [...RICH, ...routine];
export const findMessage = (id?: string) => MESSAGES.find((m) => m.id === id);

/** Everyone on the message, sender first. */
export const participants = (m: Message) => [m.from, ...m.to, ...(m.cc ?? [])];
