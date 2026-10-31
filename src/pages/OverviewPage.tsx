import { useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { STAGES } from '../data/stages';
import { usePageTitle } from '../components/usePageTitle';

const TABS = [
  { id: 'detects', label: 'What it detects' },
  { id: 'how', label: 'How it works' },
  { id: 'vault', label: 'The vault' },
  { id: 'why', label: 'Why it exists' },
] as const;

const RISKS = [
  { name: 'Bribery and corruption', desc: 'Offers of payments, gifts or favours to officials, clients or counterparties in return for business.' },
  { name: 'Money laundering', desc: 'Talk of structuring payments, shell companies or moving funds through third parties to hide where they came from.' },
  { name: 'Insider dealing', desc: 'Passing on, or trading on, confidential information before it is made public.' },
  { name: 'Market manipulation', desc: 'Coordinating orders or quotes to move prices: spoofing, front-running and collusion on benchmarks.' },
  { name: 'Sanctions evasion', desc: 'Routing business around sanctioned people, companies or regions through intermediaries.' },
  { name: 'Off-channel communication', desc: 'Moving a conversation to an unrecorded app so it escapes supervision and record-keeping.' },
];
type TabId = (typeof TABS)[number]['id'];

export default function OverviewPage() {
  const h = usePageTitle('Overview');
  const [tab, setTab] = useState<TabId>('detects');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys move between tabs, as in a11y-charts.
  const onKey = (e: KeyboardEvent, i: number) => {
    const last = TABS.length - 1;
    const next =
      e.key === 'ArrowRight' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  const [first, ...inside] = STAGES;

  return (
    <main id="main" className="main main--solo">
      <section className="hero" aria-labelledby="ov-title">
        <h1 ref={h} tabIndex={-1} id="ov-title" className="page-title">
          Catch bribery and laundering in messages no one may read.
        </h1>
        <p className="page-lede">
          Cipher Lab trains surveillance models on the email, chat and voice of banks, brokers and
          asset managers, to find bribery, money laundering, market abuse and other financial crime.
          The model goes to the vault. The messages never come out.
        </p>
        <p className="page-lede hero-lede-2">
          In the vault, the customer’s compliance officers review what those models flag, alongside
          everything else their policies catch.
        </p>
        <div className="hero-actions">
          <Link to="/lab" className="btn btn--primary">Open the lab</Link>
          <Link to="/vault" className="btn btn--secondary">Open the vault</Link>
        </div>
      </section>

      <div className="tabbar">
        <div className="tablist" role="tablist" aria-label="Overview sections">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-controls={`panel-${t.id}`}
              aria-selected={tab === t.id}
              tabIndex={tab === t.id ? 0 : -1}
              className="tab"
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onKey(e, i)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <section className="tab-panel" role="tabpanel" id="panel-detects" aria-labelledby="tab-detects" tabIndex={0} hidden={tab !== 'detects'}>
        <div className="doc-block">
          <h2 className="doc-h2">Financial crime, found in conversation</h2>
          <p className="doc-p">
            Each solution trains a model for one risk, on labelled examples from the customer’s own
            vault: email, chat, collaboration tools and voice transcripts. Once deployed, it flags new
            messages for a compliance reviewer to look at.
          </p>
          <dl className="feature-list">
            {RISKS.map((r) => (
              <div key={r.name}><dt>{r.name}</dt><dd>{r.desc}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section className="tab-panel" role="tabpanel" id="panel-how" aria-labelledby="tab-how" tabIndex={0} hidden={tab !== 'how'}>
        <div className="doc-block doc-block--first">
          <h2 className="doc-h2">One solution, seven stages</h2>
          <p className="doc-p">
            Every solution moves through the same lifecycle. Only the first stage happens outside the
            customer’s vault; one more lets aggregate scores out.
          </p>
          <ol className="flow">
            <li className="flow__stage flow__stage--outside">
              <span className="flow__num" aria-hidden="true">1</span>
              <strong className="flow__name">{first.name}</strong>
              <span className="flow__desc">{first.summary}</span>
            </li>
            <li className="flow__boundary">
              <p className="flow__boundary-label" id="boundary-label">
                <LockIcon /> Inside the customer’s vault
              </p>
              <ol className="flow__inside" aria-labelledby="boundary-label" start={2}>
                {inside.map((s, i) => (
                  <li key={s.id} className="flow__stage">
                    <span className="flow__num" aria-hidden="true">{i + 2}</span>
                    <strong className="flow__name">{s.name}</strong>
                    <span className="flow__desc">{s.summary}</span>
                    {s.zone === 'crossing' && (
                      <span className="flow__exit"><ExitIcon /> Only aggregate scores leave</span>
                    )}
                  </li>
                ))}
              </ol>
            </li>
          </ol>
        </div>

        <div className="doc-block">
          <h2 className="doc-h2">What it promises customers</h2>
          <dl className="feature-list">
            <div><dt>The data stays where it is</dt><dd>Fulfillment, analysis, training and serving run inside the customer’s vault region. Analysts see distributions and counts, never a message.</dd></div>
            <div><dt>Success is agreed first</dt><dd>Contract capture sets the criteria a model must meet, such as minimum precision on the risky label. Evaluation checks every candidate against them.</dd></div>
            <div><dt>Every decision is on the record</dt><dd>Who requested data, which features were kept, which model shipped and who switched it on. A regulator can follow the whole trail.</dd></div>
            <div><dt>Built for many customers at once</dt><dd>Service data scientists move solutions for every customer from one lab, each customer’s data sealed in its own vault.</dd></div>
          </dl>
        </div>
      </section>

      <section className="tab-panel" role="tabpanel" id="panel-vault" aria-labelledby="tab-vault" tabIndex={0} hidden={tab !== 'vault'}>
        <div className="doc-block doc-block--first">
          <h2 className="doc-h2">Where flagged messages are reviewed</h2>
          <p className="doc-p">
            The vault is the customer’s archive of every recorded conversation: email, Teams,
            Bloomberg Chat, WhatsApp, text messages, Facebook Messenger and LinkedIn, kept for as long
            as regulators require. It is where the lab’s models run, and where the firm’s compliance
            officers work through what they flag.
          </p>
          <p className="doc-p">
            It reads like an inbox. A list of messages on one side, the open message on the other,
            and beside it every policy that matched, why it matched and what the reviewer decided.
          </p>
        </div>

        <div className="doc-block">
          <h2 className="doc-h2">How the lab and the vault work together</h2>
          <ol className="loop">
            <li>
              <span className="loop__where">Lab</span>
              <strong className="loop__name">Build and deploy</strong>
              <span className="loop__desc">A service data scientist trains a model for one risk and deploys it into the customer’s vault.</span>
            </li>
            <li>
              <span className="loop__where">Vault</span>
              <strong className="loop__name">Score every message</strong>
              <span className="loop__desc">The model scores new messages where they are stored. Policies combine its score with lexicons and the vault’s own AI predictions.</span>
            </li>
            <li>
              <span className="loop__where">Vault</span>
              <strong className="loop__name">Review what’s flagged</strong>
              <span className="loop__desc">A compliance officer reads each flagged message, sees why it matched, and escalates or clears it.</span>
            </li>
            <li>
              <span className="loop__where">Back to the lab</span>
              <strong className="loop__name">Learn from decisions</strong>
              <span className="loop__desc">Cleared and escalated matches become labelled examples, and precision and drift in deployment show when a model needs retraining.</span>
            </li>
          </ol>
        </div>

        <div className="doc-block">
          <h2 className="doc-h2">What a reviewer sees</h2>
          <dl className="feature-list">
            <div><dt>Policy matches, with reasons</dt><dd>Each match names the policy and version, the group it matched under, and the cause: the lexicon phrases, highlighted in the message, or the model, its version and its score against the threshold.</dd></div>
            <div><dt>AI predictions on every message</dt><dd>Business or personal, language and sentiment, each with the model and version that made it and the policies that use it.</dd></div>
            <div><dt>Classification tags</dt><dd>The desks, regions and supervision lists the people on a message belong to, such as Trading / Derivatives or Heightened supervision.</dd></div>
            <div><dt>A decision on every match</dt><dd>Flagged, escalated or cleared, recorded per match, so the firm can show its regulator what was reviewed and by whom.</dd></div>
          </dl>
          <p className="doc-cta"><Link to="/vault" className="btn btn--secondary">Open the vault</Link></p>
        </div>
      </section>

      <section className="tab-panel" role="tabpanel" id="panel-why" aria-labelledby="tab-why" tabIndex={0} hidden={tab !== 'why'}>
        <div className="doc-block doc-block--first">
          <h2 className="doc-h2">The problem it solves</h2>
          <div className="prose">
            <p>
              Banks, brokers, trading desks and asset managers must record and supervise what their people
              say: email, chat, collaboration tools, social messages and voice. Rules such as SEC
              Rule 17a-4, FINRA Rule 3110 and MiFID II require the records to be kept and reviewed,
              and the vaults that hold them are run by providers such as Global Relay, Smarsh and
              Bloomberg Vault.
            </p>
            <p>
              Most surveillance still runs on lexicons: lists of risky words. They flag enormous
              volumes of harmless messages and miss anything said in code. A trained model reads
              context far better, but training one needs the most sensitive messages a firm holds,
              and those can’t be handed to a vendor.
            </p>
            <p>
              Cipher Lab removes that trade-off. Service data scientists build the model for the
              customer while working only with labels, counts and aggregates.
            </p>
          </div>
        </div>

        <div className="doc-block">
          <h2 className="doc-h2">Who works in it</h2>
          <table className="table">
            <caption className="visually-hidden">Roles in Cipher Lab</caption>
            <thead><tr><th scope="col">Role</th><th scope="col">What they do</th></tr></thead>
            <tbody>
              <tr><th scope="row">Service data scientist</th><td>Moves each solution through the stages, across many customers. The lab is built for them.</td></tr>
              <tr><th scope="row">Solution owner</th><td>Sits at the customer, agrees the contract and approves what goes live.</td></tr>
              <tr><th scope="row">Compliance officer</th><td>Works in the vault: reviews flagged messages, needs to know why each was flagged, and has to show their regulator.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

    </main>
  );
}

const LockIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
  </svg>
);
const ExitIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h4v4M13 3 7 9M11 10v3H3V5h3" />
  </svg>
);
