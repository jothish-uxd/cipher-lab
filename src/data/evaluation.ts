import type { Customer, Solution } from './customers';
import type { Contract } from './contracts';
import { stageIndex } from './stages';
import { useStored } from './store';
import { MODELS, valueFor, type LabelMetrics, type ModelKind, type Result } from './training';

/*
  Evaluation: compare trained models, tune the alert threshold, choose one to deploy.
  Threshold behaviour is a simple, monotone model of the precision–recall trade-off:
  raising the threshold makes alerts more precise but catches fewer real cases.
*/

export interface EvaluationState {
  inspect?: ModelKind;
  thresholds: Partial<Record<ModelKind, number>>; // 0.05–0.95, default 0.5
  chosen?: { model: ModelKind; threshold: number; at: string };
}

const key = (c: Customer, s: Solution) => `evaluation:${c.id}/${s.id}`;

export function useEvaluation(c: Customer, s: Solution, fallbackChoice?: ModelKind) {
  return useStored<EvaluationState>(key(c, s), () => ({
    thresholds: {},
    chosen: stageIndex(s.stage) > stageIndex('evaluation') && fallbackChoice
      ? { model: fallbackChoice, threshold: 0.5, at: '2026-08-12T10:00:00Z' }
      : undefined,
  }));
}

const clamp = (x: number, lo = 0.3, hi = 0.995) => Math.max(lo, Math.min(hi, x));
const f1 = (p: number, r: number) => (2 * p * r) / (p + r);

/** Metrics for the risky label at a given threshold (0.5 is the trained default). */
export function atThreshold(m: LabelMetrics, t: number): LabelMetrics {
  const d = t - 0.5;
  const precision = clamp(m.precision + (1 - m.precision) * d * 1.5);
  const recall = clamp(m.recall - m.recall * d * 0.9);
  return { precision, recall, f1: f1(precision, recall) };
}

/** A result with the risky label's metrics moved to threshold t. */
export function resultAt(res: Result, risky: string, t: number): Result {
  return { ...res, byLabel: { ...res.byLabel, [risky]: atThreshold(res.byLabel[risky], t) } };
}

export function meetsContract(res: Result, k: Contract) {
  return k.criteria.every((c) => valueFor(res, c) * 100 >= c.minimum);
}

/** Alerts a reviewer sees per 10,000 live messages, assuming 1% are truly risky. */
export function workload(m: LabelMetrics, per = 10000, prevalence = 0.01) {
  const real = per * prevalence;
  const caught = real * m.recall;
  const alerts = caught / m.precision;
  return { alerts: Math.round(alerts), caught: Math.round(caught), falseAlerts: Math.round(alerts - caught), missed: Math.round(real - caught) };
}

/** Confusion matrix on the held-out test set (20% of the imported data). */
export function confusion(m: LabelMetrics, riskyCount: number, otherCount: number) {
  const pos = Math.round(riskyCount * 0.2);
  const neg = Math.round(otherCount * 0.2);
  const tp = Math.round(pos * m.recall);
  const fn = pos - tp;
  const fp = Math.min(neg, Math.round(tp / m.precision - tp));
  const tn = neg - fp;
  return { tp, fn, fp, tn };
}

export const modelName = (m: ModelKind) => MODELS[m].name;
