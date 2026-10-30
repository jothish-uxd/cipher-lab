import { findCustomer, solutionsOf, type Model } from '../customers';
import { isLive } from '../deployment';

/*
  Where the vault meets the lab. The vault belongs to one Cipher Lab customer;
  its policies run that customer's deployed models. Live status comes from the
  lab's own deployment state, so switching a model on in the lab shows here.
*/

export const ORG = findCustomer('igbc')!;

export const findLabModel = (id?: string): Model | undefined => ORG.models.find((m) => m.id === id);

const solutionFor = (m: Model) => solutionsOf(ORG).find((s) => s.modelId === m.id);

export const modelLive = (m: Model) => {
  const s = solutionFor(m);
  return s ? isLive(ORG, s) : m.enabled;
};

/** Short status for a model, e.g. "Live" or "In evaluation". */
export const modelStatus = (m: Model) => (modelLive(m) ? 'Live' : `In ${solutionFor(m)?.stage ?? 'the lab'}`);

/** Routes into the lab (inside this app). */
export const labRoutes = {
  customer: () => `/lab/${ORG.id}`,
  model: (m: Model) => {
    const s = solutionFor(m);
    return s ? `/lab/${ORG.id}/solutions/${s.id}` : `/lab/${ORG.id}`;
  },
  newSolution: () => `/lab/${ORG.id}/solutions/new`,
};
