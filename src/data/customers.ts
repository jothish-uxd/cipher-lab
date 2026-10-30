import type { StageId } from './stages';
import { peek, put } from './store';

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
const owner_ = owner, ds_ = ds, reviewer_ = reviewer;

export const CURRENT_USER = { name: 'Jyn Erso', role: 'Service data scientist', initials: 'JE' };

export interface RiskType { name: string; labels: [string, string]; fn: string; about: string }

/** The financial-crime risks a solution can detect. */
export const RISK_TYPES: RiskType[] = [
  { name: 'Bribery and corruption', labels: ['Bribery', 'Not bribery'], fn: 'Anti-bribery', about: 'Payments, gifts or favours offered for business or influence.' },
  { name: 'Money laundering', labels: ['Laundering', 'Not laundering'], fn: 'Anti-money laundering', about: 'Structuring, shell companies and moving funds to hide their source.' },
  { name: 'Insider dealing', labels: ['Insider dealing', 'Not insider dealing'], fn: 'Market abuse', about: 'Passing on or trading on confidential information.' },
  { name: 'Market spoofing', labels: ['Spoofing', 'Not spoofing'], fn: 'Market abuse', about: 'Placing orders meant to be cancelled, to move prices.' },
  { name: 'Front-running', labels: ['Front-running', 'Not front-running'], fn: 'Market abuse', about: 'Trading ahead of a client’s order.' },
  { name: 'Benchmark collusion', labels: ['Collusion', 'No collusion'], fn: 'Market abuse', about: 'Coordinating submissions to move a benchmark rate.' },
  { name: 'Sanctions evasion', labels: ['Evasion', 'No evasion'], fn: 'Sanctions', about: 'Routing business around sanctioned people or places.' },
  { name: 'Off-channel communication', labels: ['Off-channel', 'On-channel'], fn: 'Recordkeeping', about: 'Moving conversations to unrecorded apps.' },
  { name: 'Gifts and entertainment', labels: ['Improper gift', 'Not improper'], fn: 'Anti-bribery', about: 'Hospitality that crosses the line into inducement.' },
  { name: 'Unauthorised trading', labels: ['Unauthorised', 'Authorised'], fn: 'Trading conduct', about: 'Trading beyond a trader’s mandate or limits.' },
];

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
  ...generateCustomers(),
];

/* ---------- 30 more placeholder customers ----------
   Generated from a fixed seed so the data is identical on every load. */

function generateCustomers(): Customer[] {
  let seed = 20261030;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const firms: [string, string, Region, string][] = [
    ['Aargau Central Bank', 'Central banking', 'Core Worlds', 'Aargau Deep Vault'],
    ['Scipio Treasury Bank', 'Retail banking', 'Outer Rim', 'Scipio Holovault'],
    ['Muunilinst Credit Exchange', 'Exchange', 'Outer Rim', 'Muunilinst Holovault'],
    ['Coruscant Stock Exchange', 'Exchange', 'Core Worlds', 'Galactic City Vault'],
    ['Commerce Guild Securities', 'Brokerage', 'Mid Rim', 'Guild Records Vault'],
    ['Techno Union Capital', 'Investment banking', 'Outer Rim', 'Skako Data Vault'],
    ['Trade Federation Asset Management', 'Asset management', 'Mid Rim', 'Neimoidia Vault'],
    ['Chandrila Credit Union', 'Credit union', 'Core Worlds', 'Hanna City Vault'],
    ['Alderaan Royal Trust', 'Private banking', 'Core Worlds', 'Aldera Archive Vault'],
    ['Theed Royal Bank', 'Retail banking', 'Mid Rim', 'Naboo Royal Vault'],
    ['Hosnian Prime Securities', 'Brokerage', 'Core Worlds', 'Hosnian Vault'],
    ['Canto Bight Payments', 'Payments', 'Outer Rim', 'Cantonica Vault'],
    ['Kessel Mining Finance', 'Commodities trading', 'Outer Rim', 'Kessel Run Vault'],
    ['Mon Cala Mutual', 'Asset management', 'Outer Rim', 'Dac Tidal Vault'],
    ['Bonadan Industrial Bank', 'Commercial banking', 'Outer Rim', 'Bonadan Vault'],
    ['Jakku Salvage Credit', 'Specialty lending', 'Outer Rim', 'Niima Outpost Vault'],
    ['Ord Mantell Brokerage', 'Brokerage', 'Mid Rim', 'Worlport Vault'],
    ['Mandalore Sovereign Fund', 'Sovereign wealth', 'Outer Rim', 'Sundari Vault'],
    ['Lothal Agricultural Bank', 'Commercial banking', 'Outer Rim', 'Capital City Vault'],
    ['Kashyyyk Timber Exchange', 'Commodities trading', 'Mid Rim', 'Kachirho Vault'],
    ['Sullust Energy Trading', 'Energy trading', 'Outer Rim', 'Pinyumb Vault'],
    ['Corulag Wealth Partners', 'Wealth management', 'Core Worlds', 'Corulag Vault'],
    ['Fondor Shipyards Credit', 'Specialty lending', 'Core Worlds', 'Fondor Orbital Vault'],
    ['Chandrila Pension Trust', 'Pension fund', 'Core Worlds', 'Hanna City Vault'],
    ['Kuat Treasury Partners', 'Investment banking', 'Core Worlds', 'Kuat Orbital Vault'],
    ['Bespin Clearing House', 'Clearing house', 'Outer Rim', 'Cloud City Vault'],
    ['Ryloth Ryll Commodities', 'Commodities trading', 'Outer Rim', 'Lessu Vault'],
    ['Corellian Merchant Bank', 'Commercial banking', 'Core Worlds', 'Coronet Vault'],
    ['Eriadu Capital Markets', 'Investment banking', 'Outer Rim', 'Eriadu Vault'],
    ['Taris Exchange Bank', 'Retail banking', 'Outer Rim', 'Taris Undercity Vault'],
  ];

  const risks = RISK_TYPES;
  const stages: StageId[] = ['contract', 'fulfillment', 'analysis', 'features', 'training', 'evaluation', 'deployment', 'deployment', 'deployment'];
  const owners = ['Mon Mothma', 'Bail Organa', 'Padmé Amidala', 'Lando Calrissian', 'Hera Syndulla', 'Saw Gerrera', 'Wilhuff Tarkin', 'Dexter Jettster', 'Maz Kanata', 'Rio Durant', 'Enfys Nest', 'Qi’ra', 'Tobias Beckett', 'Kleya Marki', 'Luthen Rael', 'Vel Sartha', 'Dedra Meero', 'Syril Karn', 'Mon Fortune', 'Tay Kolma'];
  const scientists = ['Jyn Erso', 'Bodhi Rook', 'Cassian Andor', 'Sabine Wren', 'Kanan Jarrus'];
  const reviewers = ['Davo Sculdun', 'Perrin Fertha', 'Blevin Haro', 'Lonni Jung'];

  return firms.map(([name, sector, region, vaultProvider], i) => {
    const id = slug(name);
    const count = i % 7 === 6 ? 0 : 1 + Math.floor(rand() * 4); // a few are still onboarding
    const chosen = [...risks].sort(() => rand() - 0.5).slice(0, count);
    const owner = pick(owners);
    const models: Model[] = [];
    const solutions: Solution[] = chosen.map((r) => {
      const stage = pick(stages);
      const sid = slug(r.name);
      const deployed = stage === 'deployment';
      const hasData = !['contract', 'fulfillment'].includes(stage);
      const hex = Math.floor(rand() * 0xffffffff).toString(16).padStart(8, '0');
      if (deployed) {
        models.push({
          id: `${id}-${sid}`,
          name: r.name,
          service: `cl-${sid}-${id.split('-')[0]}`,
          version: `${1 + Math.floor(rand() * 3)}.${Math.floor(rand() * 5)}.${Math.floor(rand() * 9)}`,
          enabled: rand() > 0.25,
        });
      }
      const team: Person[] = [owner_(owner)];
      if (stage !== 'contract') team.push(ds_(pick(scientists)));
      if (rand() > 0.5) team.push(reviewer_(pick(reviewers)));
      return {
        id: sid,
        name: r.name,
        type: 'Binary classifier',
        labels: r.labels,
        function: r.fn,
        vault: region,
        modelId: deployed ? `${id}-${sid}` : undefined,
        trainingSetId: hasData ? `ts-${hex}` : undefined,
        stage,
        enabled: deployed ? models[models.length - 1].enabled : false,
        team,
      };
    });
    const day = 1 + Math.floor(rand() * 59); // Sept 1 – Oct 29, 2026
    const d = new Date(Date.UTC(2026, 8, day));
    return {
      id,
      name,
      sector,
      region,
      vaultProvider,
      lastActivity: d.toISOString().slice(0, 10),
      solutions,
      models,
    };
  });
}

/** Customers pinned to the top of the lab's nav. */
export const PINNED = ['igbc', 'czerka', 'coruscant-stock-exchange', 'aargau-central-bank', 'mandalore-sovereign-fund'];

export const findCustomer = (id?: string) => CUSTOMERS.find((c) => c.id === id);

const createdKey = (customerId: string) => `solutions:${customerId}`;
/** Seeded solutions plus any created in the lab. Pair with useStoreVersion() to re-render. */
export function solutionsOf(c: Customer): Solution[] {
  return [...c.solutions, ...(peek<Solution[]>(createdKey(c.id)) ?? [])];
}
export function addSolution(c: Customer, s: Solution) {
  put(createdKey(c.id), [...(peek<Solution[]>(createdKey(c.id)) ?? []), s]);
}
export const findSolution = (c: Customer | undefined, id?: string) => (c ? solutionsOf(c).find((s) => s.id === id) : undefined);
