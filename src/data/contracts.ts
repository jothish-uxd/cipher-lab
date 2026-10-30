import { CURRENT_USER, type Customer, type Person, type Solution } from './customers';
import { stageIndex, type StageId } from './stages';
import { peek, useStored, useStoreVersion } from './store';

export const METRICS = ['Precision', 'Recall', 'F1 score', 'Accuracy'] as const;
export type Metric = (typeof METRICS)[number];

export const METRIC_HELP: Record<Metric, string> = {
  Precision: 'Of the messages the model flags, the share that really are the label. Low precision floods reviewers with false alerts.',
  Recall: 'Of the messages that really are the label, the share the model catches. Low recall means misconduct slips through.',
  'F1 score': 'A single balance of precision and recall.',
  Accuracy: 'The share of all messages labelled correctly. Misleading when the risky label is rare.',
};

export const CHANNELS = ['Email', 'Chat', 'Collaboration tools', 'Trading terminal chat', 'Voice transcripts', 'Social messaging'] as const;

export interface Criterion {
  id: string;
  metric: Metric;
  label: string;
  /** Minimum, as a whole percent */
  minimum: number;
}

export interface Activity { at: string; who: string; what: string }

export interface Contract {
  status: 'Draft' | 'Signed off';
  description: string;
  dates: { solutionStart: string; goLive: string; solutionEnd: string; trainingStart: string; trainingEnd: string };
  criteria: Criterion[];
  request: { perLabel: Record<string, number>; channels: string[]; from: string; to: string };
  team: Person[];
  activity: Activity[];
}

const addDays = (iso: string, days: number) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function defaultContract(c: Customer, s: Solution): Contract {
  const signed = stageIndex(s.stage) > 0;
  const start = addDays(c.lastActivity, -120);
  const owner = s.team.find((p) => p.role === 'Solution owner')?.name ?? 'Solution owner';
  const activity: Activity[] = [
    { at: start + 'T09:12:00Z', who: owner, what: 'Created the solution' },
  ];
  if (signed) activity.unshift({ at: addDays(start, 9) + 'T16:40:00Z', who: owner, what: 'Signed off the contract' });
  return {
    status: signed ? 'Signed off' : 'Draft',
    description: `Flag ${s.labels[0].toLowerCase()} in ${c.name} communications so compliance reviewers see the riskiest messages first.`,
    dates: {
      solutionStart: start,
      trainingStart: addDays(start, 14),
      trainingEnd: addDays(start, 75),
      goLive: addDays(start, 90),
      solutionEnd: addDays(start, 455),
    },
    criteria: [
      { id: 'c1', metric: 'Precision', label: s.labels[0], minimum: 80 },
      { id: 'c2', metric: 'Recall', label: s.labels[0], minimum: 75 },
    ],
    request: {
      perLabel: Object.fromEntries(s.labels.map((l) => [l, 1000])),
      channels: ['Email', 'Chat', 'Voice transcripts'],
      from: '2025-01-01',
      to: '2026-06-30',
    },
    team: s.team,
    activity,
  };
}

const contractKey = (c: Customer, s: Solution) => `contract:${c.id}/${s.id}`;
const stageKey = (c: Customer, s: Solution) => `stage:${c.id}/${s.id}`;

export function useContract(c: Customer, s: Solution) {
  return useStored<Contract>(contractKey(c, s), () => defaultContract(c, s));
}

/** The solution's current stage, including any progress made in the lab. */
export function useSolutionStage(c: Customer, s: Solution) {
  return useStored<StageId>(stageKey(c, s), () => s.stage);
}

/** Non-hook read for tables that list many solutions; call useStoreVersion() in the component to re-render. */
export function currentStage(c: Customer, s: Solution): StageId {
  return peek<StageId>(stageKey(c, s)) ?? s.stage;
}
export { useStoreVersion };

export const logEntry = (what: string): Activity => ({ at: new Date().toISOString(), who: CURRENT_USER.name, what });

/** What still blocks sign-off, in plain words. Empty when the contract is ready. */
export function signOffBlockers(k: Contract): string[] {
  const out: string[] = [];
  if (!k.description.trim()) out.push('Add a description of what the model should flag.');
  if (k.criteria.length === 0) out.push('Add at least one success criterion.');
  if (!k.team.some((p) => p.role === 'Solution owner')) out.push('Assign a solution owner.');
  if (!k.team.some((p) => p.role === 'Data scientist')) out.push('Assign a data scientist.');
  if (k.request.channels.length === 0) out.push('Choose at least one channel to request data from.');
  if (Object.values(k.request.perLabel).some((n) => !n || n < 100)) out.push('Request at least 100 examples of each label.');
  if (k.request.from > k.request.to) out.push('The data request’s start date must be before its end date.');
  if (k.dates.trainingStart > k.dates.trainingEnd) out.push('Training must start before it ends.');
  if (k.dates.goLive < k.dates.trainingEnd) out.push('Go-live must come after training ends.');
  return out;
}
