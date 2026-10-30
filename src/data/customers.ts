import type { StageId } from './stages';

/* Placeholder data — Star Wars realm. Region stands in for the
   vault's data-residency zone. */

export type Region = 'Core Worlds' | 'Mid Rim' | 'Outer Rim';

export interface Person {
  name: string;
  role: 'Solution owner' | 'Data scientist' | 'Compliance reviewer';
  access: 1 | 2 | 3;
}

export interface Solution {
  id: string;
  name: string;
  type: 'Binary classifier';
  labels: [string, string];
  function: string;
  vault: Region;
  modelId?: string;
  trainingSetId?: string;
  stage: StageId;
  enabled: boolean;
  team: Person[];
}

export interface Model {
  id: string;
  name: string;
  service: string;
  version: string;
  enabled: boolean;
}

export interface Customer {
  id: string;
  name: string;
  sector: string;
  region: Region;
  vaultProvider: string;
  lastActivity: string; // ISO date
  solutions: Solution[];
  models: Model[];
}

const owner = (name: string): Person => ({ name, role: 'Solution owner', access: 1 });
const ds = (name: string): Person => ({ name, role: 'Data scientist', access: 2 });
const reviewer = (name: string): Person => ({ name, role: 'Compliance reviewer', access: 3 });

export const CURRENT_USER = { name: 'Jyn Erso', role: 'Service data scientist', initials: 'JE' };

export const CUSTOMERS: Customer[] = [
  {
    id: 'igbc',
    name: 'InterGalactic Banking Clan',
    sector: 'Banking',
    region: 'Outer Rim',
    vaultProvider: 'Muunilinst Holovault',
    lastActivity: '2026-10-28',
    models: [
      { id: 'igbc-aml', name: 'Spice-route AML', service: 'cl-aml-pretrained', version: '2.1.0', enabled: true },
      { id: 'igbc-bribery', name: 'Senate bribery', service: 'cl-bribery-igbc', version: '1.3.2', enabled: false },
    ],
    solutions: [
      {
        id: 'spice-aml',
        name: 'Spice-route money laundering',
        type: 'Binary classifier',
        labels: ['Laundering', 'Not laundering'],
        function: 'Compliance',
        vault: 'Outer Rim',
        modelId: 'igbc-aml',
        trainingSetId: 'ts-mj652a0f',
        stage: 'deployment',
        enabled: true,
        team: [owner('San Hill'), ds('Jyn Erso'), reviewer('Rush Clovis')],
      },
      {
        id: 'senate-bribery',
        name: 'Senate bribery',
        type: 'Binary classifier',
        labels: ['Bribery', 'Not bribery'],
        function: 'Compliance',
        vault: 'Outer Rim',
        modelId: 'igbc-bribery',
        trainingSetId: 'ts-g28jdp71',
        stage: 'evaluation',
        enabled: false,
        team: [owner('Rush Clovis'), ds('Jyn Erso'), ds('Bodhi Rook')],
      },
      {
        id: 'off-channel',
        name: 'Off-channel holo-chat',
        type: 'Binary classifier',
        labels: ['Off-channel', 'On-channel'],
        function: 'Recordkeeping',
        vault: 'Outer Rim',
        stage: 'analysis',
        enabled: false,
        team: [owner('San Hill'), ds('Bodhi Rook')],
      },
    ],
  },
  {
    id: 'kdy',
    name: 'Kuat Drive Yards',
    sector: 'Defense manufacturing',
    region: 'Core Worlds',
    vaultProvider: 'Kuat Orbital Vault',
    lastActivity: '2026-10-24',
    models: [{ id: 'kdy-export', name: 'Export controls', service: 'cl-export-kdy', version: '1.0.4', enabled: true }],
    solutions: [
      {
        id: 'export-controls',
        name: 'Export controls breach',
        type: 'Binary classifier',
        labels: ['Breach', 'No breach'],
        function: 'Trade compliance',
        vault: 'Core Worlds',
        modelId: 'kdy-export',
        trainingSetId: 'ts-k7f2201c',
        stage: 'deployment',
        enabled: true,
        team: [owner('Onara Kuat'), ds('Cassian Andor')],
      },
      {
        id: 'insider-dealing',
        name: 'Insider dealing',
        type: 'Binary classifier',
        labels: ['Insider dealing', 'Not insider dealing'],
        function: 'Market abuse',
        vault: 'Core Worlds',
        stage: 'training',
        enabled: false,
        team: [owner('Onara Kuat'), ds('Jyn Erso')],
      },
    ],
  },
  {
    id: 'cec',
    name: 'Corellian Engineering Corporation',
    sector: 'Shipbuilding',
    region: 'Core Worlds',
    vaultProvider: 'Corellia Records Trust',
    lastActivity: '2026-10-21',
    models: [],
    solutions: [
      {
        id: 'gifts',
        name: 'Gifts and entertainment',
        type: 'Binary classifier',
        labels: ['Improper gift', 'Not improper'],
        function: 'Compliance',
        vault: 'Core Worlds',
        stage: 'features',
        enabled: false,
        team: [owner('Corran Horn'), ds('Cassian Andor')],
      },
      {
        id: 'cec-bribery',
        name: 'Port authority bribery',
        type: 'Binary classifier',
        labels: ['Bribery', 'Not bribery'],
        function: 'Compliance',
        vault: 'Core Worlds',
        stage: 'fulfillment',
        enabled: false,
        team: [owner('Corran Horn'), ds('Jyn Erso')],
      },
    ],
  },
  {
    id: 'czerka',
    name: 'Czerka Corporation',
    sector: 'Commodities trading',
    region: 'Outer Rim',
    vaultProvider: 'Tatooine Relay Vault',
    lastActivity: '2026-10-17',
    models: [{ id: 'czerka-sanctions', name: 'Sanctions evasion', service: 'cl-sanctions-czerka', version: '3.0.1', enabled: true }],
    solutions: [
      {
        id: 'sanctions',
        name: 'Sanctions evasion',
        type: 'Binary classifier',
        labels: ['Evasion', 'No evasion'],
        function: 'Sanctions',
        vault: 'Outer Rim',
        modelId: 'czerka-sanctions',
        trainingSetId: 'ts-cz9081ab',
        stage: 'deployment',
        enabled: true,
        team: [owner('Rendar Vaux'), ds('Bodhi Rook')],
      },
      {
        id: 'spoofing',
        name: 'Market spoofing',
        type: 'Binary classifier',
        labels: ['Spoofing', 'Not spoofing'],
        function: 'Market abuse',
        vault: 'Outer Rim',
        stage: 'contract',
        enabled: false,
        team: [owner('Rendar Vaux')],
      },
    ],
  },
  {
    id: 'bespin',
    name: 'Bespin Tibanna Exchange',
    sector: 'Energy trading',
    region: 'Outer Rim',
    vaultProvider: 'Cloud City Vault',
    lastActivity: '2026-10-09',
    models: [],
    solutions: [
      {
        id: 'front-running',
        name: 'Front-running',
        type: 'Binary classifier',
        labels: ['Front-running', 'Not front-running'],
        function: 'Market abuse',
        vault: 'Outer Rim',
        stage: 'fulfillment',
        enabled: false,
        team: [owner('Lando Calrissian'), ds('Cassian Andor')],
      },
    ],
  },
  {
    id: 'sienar',
    name: 'Sienar Fleet Systems',
    sector: 'Defense manufacturing',
    region: 'Core Worlds',
    vaultProvider: 'Lianna Data Vault',
    lastActivity: '2026-09-30',
    models: [],
    solutions: [],
  },
];

export const findCustomer = (id?: string) => CUSTOMERS.find((c) => c.id === id);
export const findSolution = (c: Customer | undefined, id?: string) => c?.solutions.find((s) => s.id === id);
