import type { Model } from '../customers';
import { findLabModel } from './lab';

/*
  Policies decide which messages a compliance officer must review.
  Each one combines detectors: a lexicon of phrases, a Cipher Lab model
  deployed in the vault, and the vault's own AI predictions as conditions.
*/

export type PredictionId = 'business' | 'language' | 'sentiment';

/** The vault's built-in AI predictions, run on every message. */
export interface PredictionModel { id: PredictionId; label: string; model: string; version: number }
export const PREDICTION_MODELS: PredictionModel[] = [
  { id: 'business', label: 'Business or personal', model: 'Business_NonBusiness', version: 2 },
  { id: 'language', label: 'Language', model: 'Language_Eng-NonEng', version: 3 },
  { id: 'sentiment', label: 'Sentiment', model: 'Sentiment_OuterRim', version: 6 },
];
export const predictionModel = (id: PredictionId) => PREDICTION_MODELS.find((m) => m.id === id)!;

export interface Policy {
  id: string;
  name: string;
  version: number;
  about: string;
  /** Lexicon phrases, matched case-insensitively */
  lexicon: string[];
  /** Cipher Lab model that scores messages for this policy */
  modelId?: string;
  threshold?: number;
  /** Vault predictions the policy uses as conditions */
  uses: PredictionId[];
  /** Classification tags the policy watches */
  scope: string[];
}

export const POLICIES: Policy[] = [
  {
    id: 'bribery', name: 'Bribery', version: 12,
    about: 'Payments, gifts or favours offered for business or influence.',
    lexicon: ['sweetener', 'off the books', 'envelope', 'grease the', 'for the senator', 'consideration for'],
    modelId: 'igbc-bribery', threshold: 0.7,
    uses: ['business', 'sentiment'],
    scope: ['or-ib', 'or-deriv', 'heightened'],
  },
  {
    id: 'aml', name: 'Anti-money laundering', version: 12,
    about: 'Structuring, shell companies and moving funds to hide their source.',
    lexicon: ['under the limit', 'split it', 'layering', 'shell', 'spice'],
    modelId: 'igbc-aml', threshold: 0.62,
    uses: ['business'],
    scope: ['or-deriv', 'or-wealth', 'heightened'],
  },
  {
    id: 'off-channel', name: 'Off-channel communication', version: 4,
    about: 'Moving conversations to unrecorded apps.',
    lexicon: ['call me on', 'switch to', 'my personal', 'delete this', 'burner'],
    uses: ['language'],
    scope: ['or'],
  },
  {
    id: 'gifts', name: 'Gifts and entertainment', version: 3,
    about: 'Hospitality that crosses the line into inducement.',
    lexicon: ['podrace', 'box at', 'cantina tab', 'tickets'],
    uses: ['business'],
    scope: ['or-trading', 'or-ib'],
  },
];
export const findPolicy = (id: string) => POLICIES.find((x) => x.id === id);
export const policyModel = (p: Policy): Model | undefined => findLabModel(p.modelId);
export const policyLabel = (p: Policy) => `${p.name} (v${p.version})`;
