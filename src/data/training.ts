import type { Customer, Solution } from './customers';
import type { Contract, Criterion } from './contracts';
import type { FeatureSettings } from './features';
import { stageIndex } from './stages';
import { useStored } from './store';

/*
  Training runs. Each candidate model trains inside the vault on the locked feature set.
  In this demo, progress follows a timer from the moment training starts,
  and results are generated per solution so they are stable between visits.
*/

export type ModelKind = 'rf' | 'nb' | 'lr' | 'gb' | 'lm';

export const MODELS: Record<ModelKind, { name: string; family: 'Baseline' | 'Modern'; about: string; seconds: number; base: [number, number] }> = {
  rf: { name: 'Random forest', family: 'Baseline', about: 'Many decision trees vote. Usually precise; can miss subtle cases.', seconds: 20, base: [0.895, 0.756] },
  nb: { name: 'Naive Bayes', family: 'Baseline', about: 'A fast word-probability model. Catches a lot, raises more false alerts.', seconds: 8, base: [0.785, 0.836] },
  lr: { name: 'Logistic regression', family: 'Baseline', about: 'A weighted sum of features. The easiest to explain to a regulator.', seconds: 12, base: [0.77, 0.832] },
  gb: { name: 'Gradient boosting', family: 'Baseline', about: 'Trees built one after another, each fixing the last one’s mistakes.', seconds: 28, base: [0.872, 0.801] },
  lm: { name: 'Fine-tuned language model', family: 'Modern', about: 'A small language model fine-tuned inside the vault. Reads context and code words.', seconds: 45, base: [0.912, 0.884] },
};
export const MODEL_ORDER: ModelKind[] = ['rf', 'nb', 'lr', 'gb', 'lm'];

export interface Run { model: ModelKind; seconds: number; abortedAfter?: number }
export interface TrainingState {
  startedAt?: string;
  runs: Run[];
  selected: ModelKind[];
  continuedAt?: string;
}

const key = (c: Customer, s: Solution) => `training:${c.id}/${s.id}`;

export function useTraining(c: Customer, s: Solution) {
  return useStored<TrainingState>(key(c, s), () => {
    const past = stageIndex(s.stage) > stageIndex('training');
    const selected: ModelKind[] = ['rf', 'nb', 'lr', 'lm'];
    return past
      ? { startedAt: '2026-08-10T09:00:00Z', runs: selected.map((m) => ({ model: m, seconds: 0 })), selected, continuedAt: '2026-08-10T12:00:00Z' }
      : { runs: [], selected };
  });
}

export type RunStatus = 'Queued' | 'Training' | 'Done' | 'Stopped';

export function runProgress(t: TrainingState, r: Run, now: number): { status: RunStatus; pct: number } {
  if (!t.startedAt) return { status: 'Queued', pct: 0 };
  const elapsed = (now - new Date(t.startedAt).getTime()) / 1000;
  if (r.abortedAfter !== undefined && r.abortedAfter < r.seconds) {
    return { status: 'Stopped', pct: Math.min(100, (r.abortedAfter / Math.max(1, r.seconds)) * 100) };
  }
  if (r.seconds <= 0 || elapsed >= r.seconds) return { status: 'Done', pct: 100 };
  return { status: 'Training', pct: Math.max(2, (elapsed / r.seconds) * 100) };
}

/* ---------- Results ---------- */

export interface LabelMetrics { precision: number; recall: number; f1: number }
export interface Result { model: ModelKind; accuracy: number; byLabel: Record<string, LabelMetrics> }

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
};
const clamp = (x: number) => Math.max(0.5, Math.min(0.985, x));
const f1 = (p: number, r: number) => (2 * p * r) / (p + r);

export function resultFor(c: Customer, s: Solution, m: ModelKind, f: FeatureSettings | null): Result {
  const seed = `${c.id}/${s.id}/${m}`;
  const [p0, r0] = MODELS[m].base;
  const embed = f && f.embedding.added && !f.removed.includes('embedding') ? 0.02 : 0;
  const small = f && f.vocabulary.maxTerms < 1000 ? -0.012 : 0;
  const lift = (m === 'lm' ? embed * 1.5 : embed * 0.5) + small;
  const p = clamp(p0 + (hash(seed + 'p') - 0.5) * 0.06 + lift);
  const r = clamp(r0 + (hash(seed + 'r') - 0.5) * 0.06 + lift);
  const [risky, other] = s.labels;
  const op = clamp(p + 0.05 + hash(seed + 'op') * 0.03);
  const or = clamp(r + 0.07 + hash(seed + 'or') * 0.03);
  return {
    model: m,
    accuracy: clamp((f1(p, r) + f1(op, or)) / 2 + (hash(seed + 'a') - 0.5) * 0.02),
    byLabel: {
      [risky]: { precision: p, recall: r, f1: f1(p, r) },
      [other]: { precision: op, recall: or, f1: f1(op, or) },
    },
  };
}

export function valueFor(res: Result, c: Criterion): number {
  if (c.metric === 'Accuracy') return res.accuracy;
  const m = res.byLabel[c.label];
  if (!m) return 0;
  return c.metric === 'Precision' ? m.precision : c.metric === 'Recall' ? m.recall : m.f1;
}

export function checkCriteria(res: Result, k: Contract) {
  const misses = k.criteria.filter((c) => valueFor(res, c) * 100 < c.minimum);
  return { passed: k.criteria.length - misses.length, total: k.criteria.length, misses };
}

export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
