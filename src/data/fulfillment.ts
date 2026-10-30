import { useEffect, useState } from 'react';
import type { Customer, Solution } from './customers';
import { CURRENT_USER } from './customers';
import { defaultContract, type Contract } from './contracts';
import { stageIndex } from './stages';
import { peek, useStored } from './store';

/*
  Data fulfillment: requests sent to the customer's vault.
  The vault reports counts only; message content never reaches the lab.
  In this demo, counts grow on a simple schedule from the moment a request is sent.
*/

export interface LabelPlan { requested: number; final: number; seconds: number }

export interface FulfillmentRequest {
  id: string;
  requestedAt: string;
  requestedBy: string;
  channels: string[];
  from: string;
  to: string;
  plan: Record<string, LabelPlan>;
  importedAt?: string;
  trainingSetId?: string;
}

export interface LabelProgress {
  label: string;
  requested: number;
  received: number;
  ready: boolean;     // received at least the requested count
  fulfilled: boolean; // the vault has finished searching
  fulfilledAt?: string;
}

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
};

/** Build a request from the contract's data request. Counts land between 1.3× and 3.5× what was asked for. */
export function makeRequest(k: Contract, seed: string, requestedAt: Date, quick = true): FulfillmentRequest {
  const plan: Record<string, LabelPlan> = {};
  Object.entries(k.request.perLabel).forEach(([label, requested], i) => {
    const r = hash(seed + label);
    plan[label] = {
      requested,
      final: Math.round(requested * (1.3 + r * 2.2) + i * 37),
      seconds: quick ? Math.round(18 + r * 30 + i * 6) : 0,
    };
  });
  return {
    id: `fr-${Math.floor(hash(seed + requestedAt.toISOString()) * 1e8).toString(36)}`,
    requestedAt: requestedAt.toISOString(),
    requestedBy: CURRENT_USER.name,
    channels: k.request.channels,
    from: k.request.from,
    to: k.request.to,
    plan,
  };
}

export function progressOf(req: FulfillmentRequest, now: number): LabelProgress[] {
  const start = new Date(req.requestedAt).getTime();
  return Object.entries(req.plan).map(([label, p]) => {
    const elapsed = (now - start) / 1000;
    const t = p.seconds <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / p.seconds));
    const received = Math.round(p.final * Math.pow(t, 1.15));
    const fulfilled = t >= 1;
    return {
      label,
      requested: p.requested,
      received,
      ready: received >= p.requested,
      fulfilled,
      fulfilledAt: fulfilled ? new Date(start + p.seconds * 1000).toISOString() : undefined,
    };
  });
}

const key = (c: Customer, s: Solution) => `fulfillment:${c.id}/${s.id}`;

/** Seeded history: solutions past this stage already imported a training set. */
function defaultRequests(c: Customer, s: Solution): FulfillmentRequest[] {
  if (stageIndex(s.stage) <= stageIndex('fulfillment')) return [];
  const k = defaultContract(c, s);
  const at = new Date(k.dates.trainingStart + 'T10:00:00Z');
  const req = makeRequest(k, c.id + s.id, at, false);
  const done = new Date(at.getTime() + 3 * 86400000).toISOString();
  return [{ ...req, importedAt: done, trainingSetId: s.trainingSetId }];
}

export function useFulfillment(c: Customer, s: Solution) {
  return useStored<FulfillmentRequest[]>(key(c, s), () => defaultRequests(c, s));
}

/** Training set for a solution, including one imported in the lab. */
export function currentTrainingSet(c: Customer, s: Solution): string | undefined {
  const stored = peek<FulfillmentRequest[]>(key(c, s));
  return stored?.find((r) => r.trainingSetId)?.trainingSetId ?? s.trainingSetId;
}

/** Re-renders every second while `active`, so counts tick up on screen. */
export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [active]);
  return active ? now : Date.now();
}
