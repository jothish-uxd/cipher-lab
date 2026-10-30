import type { Customer, Solution } from './customers';
import { useContract } from './contracts';
import { useFulfillment } from './fulfillment';
import { useStored } from './store';

/*
  Data analysis works on aggregates only.
  - A term is shown only if it appears in at least MIN_MESSAGES messages.
  - Every count gets a little random noise and is rounded, so no single message can be inferred.
  The terms themselves are invented for the demo.
*/

export const MIN_MESSAGES = 25;

export type NGram = 'words' | 'pairs' | 'triples';
export const NGRAM_LABEL: Record<NGram, string> = { words: 'Words', pairs: 'Two-word phrases', triples: 'Three-word phrases' };

export interface Rules {
  removeWords: string[];   // stop words and anything else to drop
  keepWords: string[];     // never drop these, even if a rule would
  numbers: 'remove' | 'keep';
  punctuation: 'remove' | 'keep';
  emoji: 'remove' | 'keep';
  emailAddresses: 'remove' | 'keep';
}

export interface Include {
  vocabulary: Record<string, NGram[]>; // per label
  channels: boolean;
  length: boolean;
  sentiment: boolean;
}

export interface AnalysisState {
  rules: Rules;
  include: Include;
  sentAt?: string;
}

export const DEFAULT_RULES: Rules = {
  removeWords: ['the', 'a', 'an', 'to', 'of', 'and', 'in', 'for', 'on', 'it', 'is', 'we', 'you', 'be', 'at'],
  keepWords: ['holonet', 'credits'],
  numbers: 'keep',
  punctuation: 'remove',
  emoji: 'keep',
  emailAddresses: 'remove',
};

const key = (c: Customer, s: Solution) => `analysis:${c.id}/${s.id}`;

export function useAnalysis(c: Customer, s: Solution) {
  return useStored<AnalysisState>(key(c, s), () => ({
    rules: DEFAULT_RULES,
    include: { vocabulary: {}, channels: false, length: false, sentiment: false },
  }));
}

/* ---------- Synthetic aggregates ---------- */

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
};
/** Noisy, rounded count; never reveals an exact tally. */
const noisy = (x: number, seed: string) => Math.max(0, Math.round((x * (0.94 + hash(seed) * 0.12)) / 5) * 5);

const RISK_TERMS: Record<string, Record<NGram, string[]>> = {
  bribery: {
    words: ['gift', 'favour', 'envoy', 'discreet', 'senator', 'arrangement', 'consultant', 'credits', 'dinner', 'introduce', 'approval', 'cash', 'thanks', 'permit'],
    pairs: ['small gift', 'off books', 'personal favour', 'consulting fee', 'speed approval', 'private dinner', 'keep quiet', 'cash only', 'special arrangement', 'trade permit'],
    triples: ['keep this quiet', 'take care of', 'make it worth', 'before the vote', 'through the consultant', 'not in writing', 'a small token', 'speed things up', 'outside the office', 'cover the fee'],
  },
  laundering: {
    words: ['transfer', 'shell', 'split', 'offshore', 'credits', 'cash', 'layer', 'invoice', 'holding', 'nominee', 'route', 'clean', 'deposit', 'beneficiary'],
    pairs: ['split transfers', 'shell company', 'offshore account', 'under threshold', 'cash deposit', 'third party', 'nominee director', 'trade invoice', 'route through', 'clean credits'],
    triples: ['keep it under', 'route it through', 'split into smaller', 'in another name', 'through the holding', 'before the audit', 'no paper trail', 'move the credits', 'over several days', 'via the outpost'],
  },
  market: {
    words: ['order', 'price', 'move', 'before', 'close', 'fill', 'cancel', 'tip', 'quote', 'push', 'size', 'layer', 'fix', 'heads'],
    pairs: ['big order', 'before close', 'push price', 'cancel after', 'heads up', 'quiet period', 'layer orders', 'fix rate', 'move market', 'get ahead'],
    triples: ['before it prints', 'get in ahead', 'pull the orders', 'keep this between', 'move it up', 'news hits tomorrow', 'set the fix', 'show size then', 'cancel before fill', 'buy before announcement'],
  },
  sanctions: {
    words: ['route', 'intermediary', 'origin', 'vessel', 'relabel', 'cargo', 'partner', 'blockade', 'transit', 'avoid', 'customs', 'license', 'front', 'reflag'],
    pairs: ['change origin', 'front company', 'transit port', 'relabel cargo', 'avoid customs', 'third world', 'reflag vessel', 'partner network', 'no license', 'outer route'],
    triples: ['ship through the', 'change the origin', 'under another flag', 'avoid the blockade', 'use the partner', 'not on paper', 'through the transit', 'relabel at port', 'keep names off', 'pay the intermediary'],
  },
  offchannel: {
    words: ['message', 'personal', 'comlink', 'delete', 'app', 'number', 'private', 'call', 'later', 'offline', 'channel', 'switch', 'secure', 'chat'],
    pairs: ['personal comlink', 'message me', 'switch apps', 'delete after', 'call later', 'private channel', 'not here', 'take offline', 'my number', 'secure chat'],
    triples: ['message me on', 'take this offline', 'not on this', 'delete after reading', 'call my personal', 'switch to the', 'off the record', 'on my comlink', 'talk in person', 'not on holonet'],
  },
};
const ROUTINE: Record<NGram, string[]> = {
  words: ['meeting', 'report', 'quarter', 'schedule', 'client', 'review', 'update', 'holonet', 'account', 'team', 'draft', 'call', 'agenda', 'forecast'],
  pairs: ['quarterly report', 'team meeting', 'client call', 'next week', 'draft attached', 'please review', 'status update', 'account review', 'budget forecast', 'schedule change'],
  triples: ['please find attached', 'let me know', 'see you at', 'for your review', 'as discussed earlier', 'on the agenda', 'end of quarter', 'thanks for sending', 'can we move', 'the updated forecast'],
};

function themeOf(s: Solution) {
  const t = (s.name + ' ' + s.function).toLowerCase();
  if (t.includes('launder')) return 'laundering';
  if (t.includes('sanction') || t.includes('export')) return 'sanctions';
  if (t.includes('channel') || t.includes('record')) return 'offchannel';
  if (t.includes('market') || t.includes('insider') || t.includes('front') || t.includes('spoof') || t.includes('collusion') || t.includes('trading')) return 'market';
  return 'bribery';
}

export interface Aggregates {
  volume: Record<string, number>;
  vocabulary: Record<string, Record<NGram, { label: string; value: number }[]>>;
  channels: Record<string, Record<string, number>>;
  length: Record<string, Record<string, number>>;
  sentiment: Record<string, Record<string, number>>;
  hiddenTerms: number; // terms held back by the minimum-count rule
}

export const LENGTH_BUCKETS = ['1–10 words', '11–25 words', '26–50 words', '51–100 words', 'Over 100 words'];
export const SENTIMENTS = ['Negative', 'Neutral', 'Positive'];

export function useAggregates(c: Customer, s: Solution, rules: Rules): Aggregates | null {
  const [requests] = useFulfillment(c, s);
  const [k] = useContract(c, s);
  const imported = requests.find((r) => r.importedAt);
  if (!imported) return null;

  const seed = `${c.id}/${s.id}/${imported.id}`;
  const volume: Record<string, number> = {};
  Object.entries(imported.plan).forEach(([label, p]) => { volume[label] = p.final; });
  const [risky] = s.labels;
  const theme = RISK_TERMS[themeOf(s)];
  const removed = new Set(rules.removeWords.map((w) => w.toLowerCase()));
  const kept = new Set(rules.keepWords.map((w) => w.toLowerCase()));
  let hiddenTerms = 0;

  const vocabulary: Aggregates['vocabulary'] = {};
  s.labels.forEach((label) => {
    const v = volume[label] ?? 1000;
    vocabulary[label] = {} as Record<NGram, { label: string; value: number }[]>;
    (['words', 'pairs', 'triples'] as NGram[]).forEach((g) => {
      const pool = label === risky ? [...theme[g], ...ROUTINE[g].slice(0, 4)] : ROUTINE[g];
      const base = g === 'words' ? 0.32 : g === 'pairs' ? 0.11 : 0.05;
      const items = pool
        .filter((t) => kept.has(t) || !t.split(' ').some((w) => removed.has(w)))
        .map((t, i) => ({ label: t, value: noisy(v * base * Math.pow(0.84, i) * (0.7 + hash(seed + label + t) * 0.6), seed + t) }))
        .sort((a, b) => b.value - a.value);
      const shown = items.filter((x) => x.value >= MIN_MESSAGES);
      hiddenTerms += items.length - shown.length;
      vocabulary[label][g] = shown.slice(0, 10);
    });
  });

  const channels: Aggregates['channels'] = {};
  const length: Aggregates['length'] = {};
  const sentiment: Aggregates['sentiment'] = {};
  s.labels.forEach((label, li) => {
    const v = volume[label] ?? 1000;
    const chs = imported.channels.length ? imported.channels : k.request.channels;
    const w = chs.map((ch) => 0.4 + hash(seed + label + ch) + (li === 0 && /chat|social|voice/i.test(ch) ? 0.5 : 0));
    const ws = w.reduce((a, b) => a + b, 0);
    channels[label] = Object.fromEntries(chs.map((ch, i) => [ch, noisy((v * w[i]) / ws, seed + ch + label)]));

    const lw = LENGTH_BUCKETS.map((b, i) => (li === 0 ? [0.34, 0.3, 0.2, 0.11, 0.05] : [0.16, 0.24, 0.27, 0.2, 0.13])[i] * (0.85 + hash(seed + b + label) * 0.3));
    const lws = lw.reduce((a, b) => a + b, 0);
    length[label] = Object.fromEntries(LENGTH_BUCKETS.map((b, i) => [b, noisy((v * lw[i]) / lws, seed + b)]));

    const sw = li === 0 ? [0.38, 0.44, 0.18] : [0.14, 0.62, 0.24];
    sentiment[label] = Object.fromEntries(SENTIMENTS.map((x, i) => [x, noisy(v * sw[i] * (0.9 + hash(seed + x + label) * 0.2), seed + x + label)]));
  });

  return { volume, vocabulary, channels, length, sentiment, hiddenTerms };
}
