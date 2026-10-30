export type StageId =
  | 'contract'
  | 'fulfillment'
  | 'analysis'
  | 'features'
  | 'training'
  | 'evaluation'
  | 'deployment';

export interface Stage {
  id: StageId;
  name: string;
  summary: string;
  /** Where the work happens relative to the customer's vault. */
  zone: 'outside' | 'inside' | 'crossing';
}

export const STAGES: Stage[] = [
  {
    id: 'contract',
    name: 'Contract capture',
    summary: 'Agree what the model must detect, which vault it may read, who works on it, and the success criteria it has to meet.',
    zone: 'outside',
  },
  {
    id: 'fulfillment',
    name: 'Data fulfillment',
    summary: 'Request labelled messages from the vault and track each request until enough examples of every label have arrived.',
    zone: 'inside',
  },
  {
    id: 'analysis',
    name: 'Data analysis',
    summary: 'Clean the corpus and study it through aggregates: vocabulary, channels, message length and sentiment, per label.',
    zone: 'inside',
  },
  {
    id: 'features',
    name: 'Feature engineering',
    summary: 'Turn what the analysis surfaced into the features a model trains on, with every choice recorded.',
    zone: 'inside',
  },
  {
    id: 'training',
    name: 'Training',
    summary: 'Train several candidate models on the same features and compare their precision, recall, accuracy and F1.',
    zone: 'inside',
  },
  {
    id: 'evaluation',
    name: 'Model evaluation',
    summary: 'Check candidates against the contract’s success criteria side by side, then choose the one to deploy.',
    zone: 'crossing',
  },
  {
    id: 'deployment',
    name: 'Deployment',
    summary: 'Run the chosen model as a versioned service inside the vault, and switch it on for live surveillance.',
    zone: 'inside',
  },
];

export const stageIndex = (id: StageId) => STAGES.findIndex((s) => s.id === id);
