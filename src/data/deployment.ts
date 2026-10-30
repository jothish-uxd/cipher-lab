import type { Customer, Solution } from './customers';
import { peek, put, useStored } from './store';
import type { ModelKind } from './training';

/*
  Deployment: versioned services running inside the customer's vault.
  Only one version is live at a time; the rest stay on standby for rollback.
*/

export interface Version {
  version: string;
  model: ModelKind;
  threshold: number;
  name: string;
  description: string;
  by: string;
  at: string;
}

export interface DeploymentState {
  versions: Version[];        // newest first
  live?: string;              // version number that is live
  liveSince?: string;
  deployingSince?: string;
}

const key = (c: Customer, s: Solution) => `deployment:${c.id}/${s.id}`;
export const DEPLOY_SECONDS = 8;

const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const serviceName = (c: Customer, s: Solution, n: number) => `${slug(s.name).split('-').slice(0, 2).join('-')}-${c.id.split('-')[0]}-${n}`;

function seeded(c: Customer, s: Solution, model?: ModelKind): DeploymentState {
  if (s.stage !== 'deployment' || !model) return { versions: [] };
  const m = c.models.find((x) => x.id === s.modelId);
  const version = m?.version ?? '1.0.0';
  const v: Version = {
    version, model, threshold: 0.5,
    name: m?.service ?? serviceName(c, s, 1),
    description: `Flags ${s.labels[0].toLowerCase()} in ${c.name} communications.`,
    by: s.team.find((p) => p.role === 'Data scientist')?.name ?? s.team[0]?.name ?? 'Service team',
    at: '2026-09-01T09:30:00Z',
  };
  return s.enabled ? { versions: [v], live: version, liveSince: '2026-09-01T10:00:00Z' } : { versions: [v] };
}

export function useDeployment(c: Customer, s: Solution, model?: ModelKind) {
  return useStored<DeploymentState>(key(c, s), () => seeded(c, s, model));
}

/** For the customer table: is any version live? */
export function isLive(c: Customer, s: Solution): boolean {
  const d = peek<DeploymentState>(key(c, s));
  return d ? !!d.live : s.stage === 'deployment' && s.enabled;
}
export function hasDeployment(c: Customer, s: Solution): boolean {
  const d = peek<DeploymentState>(key(c, s));
  return d ? d.versions.length > 0 : s.stage === 'deployment';
}
/** Switch surveillance on or off from outside the deployment page. */
export function setLive(c: Customer, s: Solution, on: boolean, fallbackModel: ModelKind = 'rf') {
  const d = peek<DeploymentState>(key(c, s)) ?? seeded(c, s, fallbackModel);
  const latest = d.versions[0];
  put(key(c, s), on && latest
    ? { ...d, live: d.live ?? latest.version, liveSince: d.liveSince ?? new Date().toISOString() }
    : { ...d, live: undefined, liveSince: undefined });
}

export function nextVersion(versions: Version[]): string {
  if (!versions.length) return '1.0.0';
  const [maj, min] = versions[0].version.split('.').map(Number);
  return `${maj}.${min + 1}.0`;
}
